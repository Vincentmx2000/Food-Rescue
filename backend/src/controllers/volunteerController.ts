import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import VolunteerTask, { TaskStatus } from '../models/VolunteerTask';
import Donation, { DonationStatus } from '../models/Donation';
import Claim, { ClaimStatus } from '../models/Claim';
import { ApiResponse } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';

export const getAssignedTasks = async (req: any, res: Response, next: NextFunction) => {
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

export const updateTaskStatus = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { taskId, donationId, status } = req.body;
        const userId = req.user._id;

        console.log(`UpdateTaskStatus request from ${userId} (${req.user.name}):`, JSON.stringify(req.body));

        let query: any = { volunteerId: userId };
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

            // Helpful debug: check if the task exists but is assigned to someone else
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
        await Donation.findByIdAndUpdate(task.donationId, {
            status: status === TaskStatus.PICKED_UP ? DonationStatus.PICKED_UP : DonationStatus.DISTRIBUTED,
            completedAt: status === TaskStatus.DISTRIBUTED ? new Date() : undefined
        });

        res.status(200).json(new ApiResponse(`Task status updated to ${status}`, task));
    } catch (error) {
        console.error('Error in updateTaskStatus:', error);
        next(error);
    }
};



export const getAvailableTasks = async (req: any, res: Response, next: NextFunction) => {
    try {
        // Find tasks that are OPEN (Broadcasted)
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



export const acceptTask = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { taskId, donationId } = req.body;
        console.log('Accept Task Request Body:', JSON.stringify(req.body));

        let query: any = {};
        if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
            query._id = new mongoose.Types.ObjectId(taskId);
        } else if (donationId && mongoose.Types.ObjectId.isValid(donationId)) {
            query.donationId = new mongoose.Types.ObjectId(donationId);
        } else {
            return next(new AppError('Valid Task ID or Donation ID required', 400));
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

        // Atomic update for final safety
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

        // Sync Donation and Claim
        await Donation.findByIdAndUpdate(task.donationId, {
            status: DonationStatus.VOLUNTEER_ASSIGNED,
            assignedVolunteer: volunteerIdObj
        });

        await Claim.findOneAndUpdate(
            { donationId: task.donationId },
            {
                volunteerId: volunteerIdObj,
                status: ClaimStatus.IN_PROGRESS
            }
        );

        res.status(200).json(new ApiResponse('Task accepted successfully', task));
    } catch (error) {
        console.error('Error in acceptTask:', error);
        next(error);
    }
};

export const getRescueHistory = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);
        const tasks = await VolunteerTask.find({
            volunteerId: userId,
            status: { $in: [TaskStatus.DISTRIBUTED, TaskStatus.DELIVERED, TaskStatus.CANCELLED] }
        }).populate({
            path: 'donationId',
            populate: { path: 'donorId', select: 'name' }
        }).sort({ completedAt: -1 });

        res.status(200).json(new ApiResponse('Rescue history fetched', tasks));
    } catch (error) {
        next(error);
    }
};
