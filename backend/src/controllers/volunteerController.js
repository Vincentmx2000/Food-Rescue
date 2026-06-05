import mongoose from 'mongoose';
import VolunteerTask, { TaskStatus } from '../models/VolunteerTask.js';
import Donation, { DonationStatus } from '../models/Donation.js';
import Claim, { ClaimStatus } from '../models/Claim.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import { createNotification } from '../utils/notifHelper.js';
import { NotificationType } from '../models/Notification.js';

export const getAssignedTasks = async (req, res, next) => {
    try {
        const userId = req.user._id;
        console.log(`Fetching assigned tasks for volunteer: ${userId} (${req.user.name})`);

        const tasks = await VolunteerTask.find({
            volunteerId: userId,
            status: { $in: [TaskStatus.ASSIGNED, TaskStatus.PICKED_UP] }
        }).populate({
            path: 'donationId',
            populate: { path: 'donorId', select: 'name organization' }
        }).populate('ngoId', 'name organization phone');

        console.log(`Found ${tasks.length} assigned tasks for user ${userId}`);
        res.status(200).json(new ApiResponse('Assigned tasks fetched', tasks));
    } catch (error) {
        console.error('Error in getAssignedTasks:', error);
        next(error);
    }
};

export const updateTaskStatus = async (req, res, next) => {
    try {
        const { taskId, donationId, status } = req.body;
        const userId = req.user._id;

        console.log(`UpdateTaskStatus request from ${userId} (${req.user.name}):`, JSON.stringify(req.body));

        let query = { volunteerId: userId };
        if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
            query._id = new mongoose.Types.ObjectId(taskId);
        } else if (donationId && mongoose.Types.ObjectId.isValid(donationId)) {
            query.donationId = new mongoose.Types.ObjectId(donationId);
        } else {
            console.log('UpdateTaskStatus: Missing valid Task ID or Donation ID');
            return next(new AppError('Valid Task ID or Donation ID required', 400));
        }

        console.log('UpdateTaskStatus searching for task with query:', JSON.stringify(query));
        const task = await VolunteerTask.findOne(query);

        if (!task) {
            console.log(`UpdateTaskStatus: Task not found for query ${JSON.stringify(query)} and volunteer ${userId}`);

            const existingAny = await VolunteerTask.findOne(taskId ? { _id: taskId } : { donationId });
            if (existingAny) {
                console.log(`Task exists but volunteerId mismatch. Task volunteerId: ${existingAny.volunteerId}, Request userId: ${userId}`);
                return next(new AppError('This task is not assigned to you.', 403));
            }

            return next(new AppError('Assigned task not found. Make sure you accepted this delivery.', 404));
        }

        console.log(`Updating task ${task._id} status from ${task.status} to ${status}`);
        task.status = status;

        if (status === TaskStatus.PICKED_UP) {
            task.pickedUpAt = new Date();
        }

        if (status === TaskStatus.DISTRIBUTED) {
            task.distributedAt = new Date();
            task.completedAt = new Date();
        }

        await task.save();

        console.log(`Syncing donation ${task.donationId} with status ${status}`);
        const donation = await Donation.findByIdAndUpdate(task.donationId, {
            status: status === TaskStatus.PICKED_UP ? DonationStatus.PICKED_UP : DonationStatus.DISTRIBUTED,
            pickedUpAt: status === TaskStatus.PICKED_UP ? new Date() : undefined,
            completedAt: status === TaskStatus.DISTRIBUTED ? new Date() : undefined
        });

        if (donation) {
            // NOTIFICATION: Notify NGO
            await createNotification(
                task.ngoId,
                status === TaskStatus.PICKED_UP ? NotificationType.PICKED_UP : NotificationType.DISTRIBUTED,
                status === TaskStatus.PICKED_UP ? 'Food Picked Up' : 'Food Distributed',
                `Volunteer ${req.user.name} has ${status === TaskStatus.PICKED_UP ? 'picked up' : 'distributed'} the donation: ${donation.foodType}.`,
                `/ngo/claim/${donation._id}`,
                req.user._id
            );
            
            // NOTIFICATION: Notify Donor
            await createNotification(
                donation.donorId,
                status === TaskStatus.PICKED_UP ? NotificationType.PICKED_UP : NotificationType.DISTRIBUTED,
                status === TaskStatus.PICKED_UP ? 'Food Picked Up' : 'Food Distributed',
                `Your donation of ${donation.foodType} has been ${status === TaskStatus.PICKED_UP ? 'picked up' : 'distributed'} by volunteer ${req.user.name}.`,
                `/donation/${donation._id}`,
                req.user._id
            );
        }

        res.status(200).json(new ApiResponse(`Task status updated to ${status}`, task));
    } catch (error) {
        console.error('Error in updateTaskStatus:', error);
        next(error);
    }
};

export const getAvailableTasks = async (req, res, next) => {
    try {
        const tasks = await VolunteerTask.find({
            status: TaskStatus.OPEN
        })
            .populate({
                path: 'donationId',
                populate: { path: 'donorId', select: 'name organization' }
            })
            .populate('ngoId', 'name organization phone');

        res.status(200).json(new ApiResponse('Available tasks fetched', tasks));
    } catch (error) {
        next(error);
    }
};

export const acceptTask = async (req, res, next) => {
    try {
        const { taskId, donationId } = req.body;
        console.log('Accept Task Request Body:', JSON.stringify(req.body));

        let query = {};
        if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
            query._id = new mongoose.Types.ObjectId(taskId);
        } else if (donationId && mongoose.Types.ObjectId.isValid(donationId)) {
            query.donationId = new mongoose.Types.ObjectId(donationId);
        } else {
            return next(new AppError('Valid Task ID or Donation ID required', 400));
        }

        if (!req.user.isVerified) {
            return next(new AppError('Your volunteer account is not yet verified by Admin. You cannot accept tasks until verified.', 403));
        }

        const volunteerIdObj = new mongoose.Types.ObjectId(req.user._id);

        console.log(`Volunteer ${req.user._id} attempting to accept task/donation`, query);

        const existingTask = await VolunteerTask.findOne({
            ...query,
            status: TaskStatus.OPEN
        });

        if (!existingTask) {
            console.log(`Debug acceptTask: Task matching ${JSON.stringify(query)} NOT FOUND or not OPEN`);
            return next(new AppError('Available task not found for this donation. Someone else might have claimed it.', 404));
        }

        const task = await VolunteerTask.findOneAndUpdate(
            {
                _id: existingTask._id,
                status: TaskStatus.OPEN,
                $or: [{ volunteerId: null }, { volunteerId: { $exists: false } }]
            },
            {
                status: TaskStatus.ASSIGNED,
                volunteerId: volunteerIdObj,
                acceptedAt: new Date()
            },
            { new: true }
        );

        if (!task) {
            return next(new AppError('Task already claimed by another volunteer', 400));
        }

        console.log(`Task ${task._id} successfully accepted by volunteer ${req.user._id}`);

        await Donation.findByIdAndUpdate(task.donationId, {
            status: DonationStatus.VOLUNTEER_ASSIGNED,
            assignedVolunteer: volunteerIdObj,
            volunteerAssignedAt: new Date()
        });

        await Claim.findOneAndUpdate(
            { donationId: task.donationId },
            {
                volunteerId: volunteerIdObj,
                status: ClaimStatus.IN_PROGRESS
            }
        );

        // NOTIFICATION: Notify NGO
        await createNotification(
            task.ngoId,
            NotificationType.VOLUNTEER_ASSIGNED,
            'Task Accepted',
            `Volunteer ${req.user.name} has accepted the rescue mission for your claim.`,
            `/ngo/claim/${task.donationId}`,
            req.user._id
        );

        res.status(200).json(new ApiResponse('Task accepted successfully', task));
    } catch (error) {
        console.error('Error in acceptTask:', error);
        next(error);
    }
};

export const getRescueHistory = async (req, res, next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);
        const tasks = await VolunteerTask.find({
            volunteerId: userId,
            status: { $in: [TaskStatus.DISTRIBUTED, TaskStatus.DELIVERED, TaskStatus.CANCELLED] }
        }).populate({
            path: 'donationId',
            populate: { path: 'donorId', select: 'name' }
        }).sort({ completedAt: -1 }).lean();

        const tasksWithProof = await Promise.all(
            tasks.map(async (task) => {
                if (task.donationId && task.donationId._id) {
                    const claim = await Claim.findOne({ donationId: task.donationId._id }).lean();
                    task.donationId.distributionProofImages = claim?.distributionProofImages || [];
                }
                return task;
            })
        );

        res.status(200).json(new ApiResponse('Rescue history fetched', tasksWithProof));
    } catch (error) {
        next(error);
    }
};

export const uploadVolunteerDistributionProof = async (req, res, next) => {
    try {
        const { donationId } = req.body;
        const imageUrls = req.files ? req.files.map(f => f.path) : [];

        console.log('uploadVolunteerDistributionProof called');
        console.log('donationId:', donationId);
        console.log('imageUrls:', imageUrls);

        const hasExisting = req.body && Object.prototype.hasOwnProperty.call(req.body, 'existingProofImages');
        const hasNew = req.files && req.files.length > 0;

        if (!hasExisting && !hasNew) {
            return next(new AppError('Please upload at least one proof image', 400));
        }

        const task = await VolunteerTask.findOne({
            donationId,
            volunteerId: req.user._id,
            status: { $in: [TaskStatus.ASSIGNED, TaskStatus.PICKED_UP, TaskStatus.DISTRIBUTED] }
        });

        if (!task) {
            return next(new AppError('Active task not found for this donation and volunteer', 404));
        }

        let claim = await Claim.findOne({ donationId });

        if (!claim) {
            return next(new AppError('Claim record not found', 404));
        }

        let currentProofImages = claim.distributionProofImages || [];

        if (hasExisting) {
            const keepImages = Array.isArray(req.body.existingProofImages)
                ? req.body.existingProofImages
                : (req.body.existingProofImages ? [req.body.existingProofImages] : []);

            currentProofImages = currentProofImages.filter(img => {
                const normalizedPath = img.replace(/\\/g, '/');
                return keepImages.some((keep) => keep.includes(normalizedPath));
            });
        }

        if (hasNew) {
            const newImages = req.files.map(f => f.path);
            currentProofImages = [...currentProofImages, ...newImages];
        }

        claim.distributionProofImages = currentProofImages;
        claim.status = ClaimStatus.COMPLETED;
        await claim.save();

        task.status = TaskStatus.DISTRIBUTED;
        task.distributedAt = new Date();
        task.completedAt = new Date();
        await task.save();

        const donationFull = await Donation.findByIdAndUpdate(donationId, {
            status: DonationStatus.DISTRIBUTED,
            completedAt: new Date()
        });

        if (donationFull) {
            await createNotification(
                task.ngoId,
                NotificationType.DISTRIBUTED,
                'Rescue Mission Completed',
                `Volunteer ${req.user.name} has uploaded distribution proof for ${donationFull.foodType}.`,
                `/ngo/claim/${donationFull._id}`,
                req.user._id
            );

            await createNotification(
                donationFull.donorId,
                NotificationType.DISTRIBUTED,
                'Donation Distributed',
                `Your donation of ${donationFull.foodType} has been successfully distributed by volunteer ${req.user.name}!`,
                `/donation/${donationFull._id}`,
                req.user._id
            );
        }

        console.log('Volunteer distribution proof upload complete');
        res.status(200).json(new ApiResponse('Distribution proof uploaded and task completed successfully'));
    } catch (error) {
        console.error('Error in uploadVolunteerDistributionProof:', error);
        next(error);
    }
};
