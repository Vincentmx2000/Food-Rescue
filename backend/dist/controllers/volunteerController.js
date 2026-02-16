"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRescueHistory = exports.acceptTask = exports.getAvailableTasks = exports.updateTaskStatus = exports.getAssignedTasks = void 0;
const VolunteerTask_1 = __importStar(require("../models/VolunteerTask"));
const Donation_1 = __importStar(require("../models/Donation"));
const ApiResponse_1 = require("../utils/ApiResponse");
const AppError_1 = require("../utils/AppError");
const getAssignedTasks = async (req, res, next) => {
    try {
        const tasks = await VolunteerTask_1.default.find({
            volunteerId: req.user._id,
            status: { $in: [VolunteerTask_1.TaskStatus.ASSIGNED, VolunteerTask_1.TaskStatus.PICKED_UP] }
        }).populate({
            path: 'donationId',
            populate: { path: 'donorId', select: 'name organization' }
        }).populate('ngoId', 'name organization phone');
        res.status(200).json(new ApiResponse_1.ApiResponse('Assigned tasks fetched', tasks));
    }
    catch (error) {
        next(error);
    }
};
exports.getAssignedTasks = getAssignedTasks;
const updateTaskStatus = async (req, res, next) => {
    try {
        const { taskId, status } = req.body; // PICKED_UP or DISTRIBUTED
        const task = await VolunteerTask_1.default.findOne({ _id: taskId, volunteerId: req.user._id });
        if (!task)
            return next(new AppError_1.AppError('Task not found', 404));
        task.status = status;
        if (status === VolunteerTask_1.TaskStatus.PICKED_UP)
            task.pickedUpAt = new Date();
        if (status === VolunteerTask_1.TaskStatus.DISTRIBUTED) {
            task.distributedAt = new Date();
            task.completedAt = new Date();
        }
        await task.save();
        await Donation_1.default.findByIdAndUpdate(task.donationId, {
            status: status === VolunteerTask_1.TaskStatus.PICKED_UP ? Donation_1.DonationStatus.PICKED_UP : Donation_1.DonationStatus.DISTRIBUTED,
            completedAt: status === VolunteerTask_1.TaskStatus.DISTRIBUTED ? new Date() : undefined
        });
        res.status(200).json(new ApiResponse_1.ApiResponse(`Task status updated to ${status}`));
    }
    catch (error) {
        next(error);
    }
};
exports.updateTaskStatus = updateTaskStatus;
const Claim_1 = __importDefault(require("../models/Claim"));
const getAvailableTasks = async (req, res, next) => {
    try {
        // Find tasks that are OPEN (Broadcasted)
        const tasks = await VolunteerTask_1.default.find({
            status: VolunteerTask_1.TaskStatus.OPEN
        })
            .populate({
            path: 'donationId',
            populate: { path: 'donorId', select: 'name organization' }
        })
            .populate('ngoId', 'name organization phone');
        res.status(200).json(new ApiResponse_1.ApiResponse('Available tasks fetched', tasks));
    }
    catch (error) {
        next(error);
    }
};
exports.getAvailableTasks = getAvailableTasks;
const acceptTask = async (req, res, next) => {
    try {
        const { taskId } = req.body;
        console.log('Accept Task Request Body:', JSON.stringify(req.body));
        console.log('User ID from Token:', req.user._id);
        console.log(`Volunteer ${req.user._id} attempting to accept task ${taskId}`);
        const existingTask = await VolunteerTask_1.default.findById(taskId);
        if (!existingTask) {
            console.log(`Debug acceptTask: Task ${taskId} NOT FOUND in DB`);
            return next(new AppError_1.AppError('Task not found', 404));
        }
        console.log(`Debug acceptTask: Task ${taskId} found. Status: ${existingTask.status}, Volunteer: ${existingTask.volunteerId}`);
        // Atomic update for final safety
        const task = await VolunteerTask_1.default.findOneAndUpdate({
            _id: taskId,
            status: VolunteerTask_1.TaskStatus.OPEN,
            $or: [{ volunteerId: null }, { volunteerId: { $exists: false } }]
        }, {
            status: VolunteerTask_1.TaskStatus.ASSIGNED,
            volunteerId: req.user._id,
            acceptedAt: new Date()
        }, { new: true });
        if (!task) {
            console.log(`Task ${taskId} could not be updated (likely status changed or already assigned)`);
            return next(new AppError_1.AppError('Task already claimed by another volunteer', 400));
        }
        console.log(`Task ${taskId} successfully accepted by volunteer ${req.user._id}`);
        // Sync Donation and Claim
        await Donation_1.default.findByIdAndUpdate(task.donationId, {
            status: Donation_1.DonationStatus.VOLUNTEER_ASSIGNED,
            assignedVolunteer: req.user._id
        });
        await Claim_1.default.findOneAndUpdate({ donationId: task.donationId }, { volunteerId: req.user._id });
        res.status(200).json(new ApiResponse_1.ApiResponse('Task accepted successfully', task));
    }
    catch (error) {
        next(error);
    }
};
exports.acceptTask = acceptTask;
const getRescueHistory = async (req, res, next) => {
    try {
        const tasks = await VolunteerTask_1.default.find({
            volunteerId: req.user._id,
            status: { $in: [VolunteerTask_1.TaskStatus.DISTRIBUTED, VolunteerTask_1.TaskStatus.CANCELLED] }
        }).populate({
            path: 'donationId',
            populate: { path: 'donorId', select: 'name' }
        }).sort({ completedAt: -1 });
        res.status(200).json(new ApiResponse_1.ApiResponse('Rescue history fetched', tasks));
    }
    catch (error) {
        next(error);
    }
};
exports.getRescueHistory = getRescueHistory;
