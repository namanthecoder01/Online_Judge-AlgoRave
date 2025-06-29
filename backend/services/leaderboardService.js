import User from '../model/User.js';
import Leaderboard from '../model/Leaderboard.js';
import Submission from '../model/Submission.js';
import ContestResult from '../model/ContestResult.js';
import Problem from '../model/Problem.js';

// Rating calculation constants
const RATING_CONSTANTS = {
    K_FACTOR: 32,
    INITIAL_RATING: 1500,
    MIN_RATING: 0,
    MAX_RATING: 3000
};

// Difficulty rating changes
const DIFFICULTY_RATING_CHANGES = {
    easy: { solved: 10, rating: 5 },
    medium: { solved: 20, rating: 15 },
    hard: { solved: 30, rating: 25 }
};

/**
 * Calculate new rating based on Elo rating system
 */
const calculateNewRating = (currentRating, expectedRating, actualScore) => {
    const newRating = currentRating + RATING_CONSTANTS.K_FACTOR * (actualScore - expectedRating);
    return Math.max(RATING_CONSTANTS.MIN_RATING, Math.min(RATING_CONSTANTS.MAX_RATING, newRating));
};

/**
 * Calculate expected score based on rating difference
 */
const calculateExpectedScore = (ratingA, ratingB) => {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

/**
 * Determine badge based on rating and problems solved
 */
const calculateBadge = (rating, problemsSolved = 0) => {
    if (problemsSolved >= 50 || rating >= 2000) {
        return "Grandmaster Coder";
    } else if (problemsSolved >= 30 || rating >= 1800) {
        return "Contest Conqueror";
    } else if (problemsSolved >= 20 || rating >= 1600) {
        return "Problem Slayer";
    } else if (problemsSolved >= 10 || rating >= 1400) {
        return "Algorithm Ace";
    } else {
        return "Code Novice";
    }
};

/**
 * Assign badge to user based on performance criteria
 */
const assignBadge = async (userId) => {
    try {
        // Fetch user stats
        const solvedCount = await Submission.countDocuments({ user: userId, status: 'accepted' });
        const leaderboardEntry = await Leaderboard.findOne({ user: userId });
        const rating = leaderboardEntry ? leaderboardEntry.rating : 0;
        const contestResults = await ContestResult.find({ user: userId });
        const contestWins = contestResults.filter(r => r.rank === 1).length;
        const contestTop10 = contestResults.filter(r => r.rank && r.rank <= 10).length;

        // Determine badge based on performance
        let badge = calculateBadge(rating, solvedCount);
        
        // Special badge for contest performance (overrides regular badge)
        if (contestWins > 0) {
            badge = "Grandmaster Coder"; // Contest winners get the highest badge
        } else if (contestTop10 > 0) {
            badge = "Contest Conqueror"; // Top 10 contestants get contest conqueror
        }

        // Update User model
        await User.findByIdAndUpdate(userId, { badge });
        
        // Also update Leaderboard model to keep them in sync
        if (leaderboardEntry) {
            await Leaderboard.findByIdAndUpdate(leaderboardEntry._id, { badge });
        }
        
        return badge;
    } catch (error) {
        console.error('Error assigning badge:', error);
        return "Code Novice";
    }
};

/**
 * Update leaderboard when user solves a problem
 */
export const updateLeaderboardOnProblemSolved = async (userId, problemId, language) => {
    try {
        // Get problem details
        const problem = await Problem.findById(problemId);
        if (!problem) {
            throw new Error('Problem not found');
        }

        // Get or create leaderboard entry
        let leaderboardEntry = await Leaderboard.findOne({ user: userId });
        
        if (!leaderboardEntry) {
            // Create new leaderboard entry
            leaderboardEntry = new Leaderboard({
                user: userId,
                username: 'User', // This should be updated with actual username
                rating: RATING_CONSTANTS.INITIAL_RATING,
                solved: 0,
                contests: 0,
                winRate: 0,
                country: 'Unknown',
                badge: 'Code Novice',
                recentActivity: []
            });
        }

        // Check if user already solved this problem
        const existingSubmission = await Submission.findOne({
            user: userId,
            problem: problemId,
            status: 'accepted'
        });

        if (existingSubmission) {
            return leaderboardEntry; // Already solved
        }

        // Calculate rating change based on difficulty
        const difficultyChange = DIFFICULTY_RATING_CHANGES[problem.difficulty];
        const newRating = leaderboardEntry.rating + difficultyChange.rating;
        const newSolved = leaderboardEntry.solved + 1;

        // Update leaderboard entry
        const updatedEntry = await Leaderboard.findOneAndUpdate(
            { user: userId },
            {
                $inc: { 
                    solved: 1,
                    rating: difficultyChange.rating
                },
                $set: {
                    badge: calculateBadge(newRating, newSolved),
                    updatedAt: new Date()
                }
            },
            { new: true, upsert: true }
        );

        // Assign badge to User model
        await assignBadge(userId);

        console.log(`Updated leaderboard for user ${userId}: +${difficultyChange.rating} rating, +1 solved`);
        return updatedEntry;
    } catch (error) {
        console.error('Error updating leaderboard on problem solved:', error);
        throw error;
    }
};

/**
 * Update leaderboard when contest ends
 */
export const updateLeaderboardOnContestEnd = async (contestId) => {
    try {
        // Get all contest results
        const contestResults = await ContestResult.find({ contest: contestId })
            .populate('user', 'firstname lastname')
            .sort({ score: -1, timeTaken: 1 });

        // Calculate ranks
        let currentRank = 1;
        let currentScore = null;
        let currentTime = null;

        for (const result of contestResults) {
            // Same rank for same score and time
            if (currentScore !== result.score || currentTime !== result.timeTaken) {
                currentRank = contestResults.indexOf(result) + 1;
            }
            
            result.rank = currentRank;
            currentScore = result.score;
            currentTime = result.timeTaken;
            await result.save();
        }

        // Update leaderboard for each participant
        for (const result of contestResults) {
            await updateLeaderboardOnContestResult(result);
        }

        console.log(`Updated leaderboard for contest ${contestId} with ${contestResults.length} participants`);
    } catch (error) {
        console.error('Error updating leaderboard on contest end:', error);
        throw error;
    }
};

/**
 * Update leaderboard for individual contest result
 */
const updateLeaderboardOnContestResult = async (contestResult) => {
    try {
        const { user, rank, score, problemsSolved, totalProblems } = contestResult;

        // Get or create leaderboard entry
        let leaderboardEntry = await Leaderboard.findOne({ user: user._id });
        
        if (!leaderboardEntry) {
            leaderboardEntry = new Leaderboard({
                user: user._id,
                username: `${user.firstname} ${user.lastname}`,
                rating: RATING_CONSTANTS.INITIAL_RATING,
                solved: 0,
                contests: 0,
                winRate: 0,
                country: 'Unknown',
                badge: 'Code Novice',
                recentActivity: []
            });
        }

        // Calculate rating change based on performance
        const performanceRating = calculateContestPerformanceRating(rank, score, problemsSolved, totalProblems);
        const newRating = Math.max(RATING_CONSTANTS.MIN_RATING, 
                                 Math.min(RATING_CONSTANTS.MAX_RATING, 
                                        leaderboardEntry.rating + performanceRating));

        // Update recent activity
        const recentActivity = [...leaderboardEntry.recentActivity, rank];
        if (recentActivity.length > 10) {
            recentActivity.shift(); // Keep only last 10 contests
        }

        // Calculate win rate
        const totalContests = leaderboardEntry.contests + 1;
        const wins = recentActivity.filter(pos => pos <= 3).length; // Top 3 considered wins
        const winRate = Math.round((wins / recentActivity.length) * 100);

        // Update leaderboard entry
        const updatedEntry = await Leaderboard.findOneAndUpdate(
            { user: user._id },
            {
                $inc: { contests: 1 },
                $set: {
                    rating: newRating,
                    badge: calculateBadge(newRating, leaderboardEntry.solved),
                    recentActivity: recentActivity,
                    winRate: winRate,
                    updatedAt: new Date()
                }
            },
            { new: true, upsert: true }
        );

        // Assign badge to User model
        await assignBadge(user._id);

        console.log(`Updated leaderboard for user ${user._id}: contest rank ${rank}, rating change ${performanceRating}`);
        return updatedEntry;
    } catch (error) {
        console.error('Error updating leaderboard on contest result:', error);
        throw error;
    }
};

/**
 * Calculate rating change based on contest performance
 */
const calculateContestPerformanceRating = (rank, score, problemsSolved, totalProblems) => {
    // Base rating change based on rank
    let ratingChange = 0;
    
    if (rank === 1) ratingChange = 50;      // 1st place
    else if (rank <= 3) ratingChange = 30;  // Top 3
    else if (rank <= 10) ratingChange = 20; // Top 10
    else if (rank <= 25) ratingChange = 10; // Top 25
    else if (rank <= 50) ratingChange = 5;  // Top 50
    else ratingChange = -5;                 // Below 50

    // Bonus for solving problems
    const problemBonus = (problemsSolved / totalProblems) * 10;
    ratingChange += problemBonus;

    // Bonus for high score
    if (score > 80) ratingChange += 10;
    else if (score > 60) ratingChange += 5;

    return Math.round(ratingChange);
};

/**
 * Get user's leaderboard stats
 */
export const getUserLeaderboardStats = async (userId) => {
    try {
        let stats = await Leaderboard.findOne({ user: userId });
        
        if (!stats) {
            console.log(`[LeaderboardService] No leaderboard stats found for user ${userId}. Creating new entry.`);
            // Fetch user details to populate the leaderboard entry
            const user = await User.findById(userId);
            if (!user) {
                console.error(`[LeaderboardService] User with ID ${userId} not found.`);
                // This case should ideally not happen if called after user creation
                throw new Error('User not found when creating leaderboard stats');
            }
            console.log(`[LeaderboardService] Found user: ${user.username}`);

            // Create default stats
            stats = new Leaderboard({
                user: userId,
                username: user.username, // Use the actual username
                rating: RATING_CONSTANTS.INITIAL_RATING,
                solved: 0,
                contests: 0,
                winRate: 0,
                country: user.country || 'Unknown', // Use the user's country
                badge: 'Code Novice',
                recentActivity: []
            });
            await stats.save();
            console.log(`[LeaderboardService] Successfully saved new leaderboard entry for user: ${user.username}`);
        } else {
            console.log(`[LeaderboardService] Found existing leaderboard stats for user ${userId}.`);
        }

        return stats;
    } catch (error) {
        console.error('Error getting user leaderboard stats:', error);
        throw error;
    }
};

/**
 * Recalculate all leaderboard entries (for admin use)
 */
export const recalculateAllLeaderboards = async () => {
    try {
        console.log('Starting leaderboard recalculation...');
        
        // Get all users with submissions
        const usersWithSubmissions = await Submission.distinct('user');
        
        for (const userId of usersWithSubmissions) {
            // Count solved problems
            const solvedProblems = await Submission.countDocuments({
                user: userId,
                status: 'accepted'
            });

            // Count contests participated
            const contestsParticipated = await ContestResult.countDocuments({
                user: userId,
                participated: true
            });

            // Calculate win rate
            const contestResults = await ContestResult.find({
                user: userId,
                participated: true
            }).sort({ createdAt: -1 }).limit(10);

            const wins = contestResults.filter(result => result.rank <= 3).length;
            const winRate = contestResults.length > 0 ? Math.round((wins / contestResults.length) * 100) : 0;

            // Calculate recent activity
            const recentActivity = contestResults.map(result => result.rank);

            // Calculate rating based on solved problems
            const baseRating = RATING_CONSTANTS.INITIAL_RATING + (solvedProblems * 10);

            // Update leaderboard
            await Leaderboard.findOneAndUpdate(
                { user: userId },
                {
                    solved: solvedProblems,
                    contests: contestsParticipated,
                    winRate: winRate,
                    rating: baseRating,
                    badge: calculateBadge(baseRating, solvedProblems),
                    recentActivity: recentActivity,
                    updatedAt: new Date()
                },
                { upsert: true }
            );

            // Assign badge to User model
            await assignBadge(userId);
        }

        console.log(`Recalculated leaderboards for ${usersWithSubmissions.length} users`);
    } catch (error) {
        console.error('Error recalculating leaderboards:', error);
        throw error;
    }
};

// Update user's leaderboard entry when they solve problems or participate in contests
export const updateUserLeaderboard = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // Get user statistics
        const submissions = await Submission.find({ user: userId });
        const contestResults = await ContestResult.find({ user: userId });
        
        const totalSubmissions = submissions.length;
        const correctSubmissions = submissions.filter(s => s.status === 'accepted').length;
        const problemsSolved = user.problemsSolved || 0;
        const contestsParticipated = contestResults.length;
        
        // Calculate win rate based on contest performance
        let winRate = 0;
        if (contestsParticipated > 0) {
            const totalContestProblems = contestResults.reduce((sum, cr) => sum + cr.totalProblems, 0);
            const solvedContestProblems = contestResults.reduce((sum, cr) => sum + cr.problemsSolved, 0);
            winRate = totalContestProblems > 0 ? Math.round((solvedContestProblems / totalContestProblems) * 100) : 0;
        }

        // Calculate rating based on problems solved and contest performance
        let rating = 1500; // Base rating
        rating += problemsSolved * 10; // +10 points per problem solved
        rating += contestsParticipated * 5; // +5 points per contest participated
        
        // Bonus for good contest performance
        contestResults.forEach(cr => {
            if (cr.rank && cr.rank <= 10) {
                rating += (11 - cr.rank) * 5; // Bonus points for top 10 finishes
            }
        });

        // Determine badge based on rating and problems solved
        const badge = calculateBadge(rating, problemsSolved);

        // Update or create leaderboard entry
        await Leaderboard.findOneAndUpdate(
            { user: userId },
            {
                rating,
                badge,
                solved: problemsSolved,
                contests: contestsParticipated,
                winRate,
                country: user.country || "Unknown",
                recentActivity: contestResults.slice(-5).map(cr => cr.rank || 0) // Last 5 contest ranks
            },
            { upsert: true, new: true }
        );

        // Use assignBadge function to ensure consistent badge assignment including contest performance
        await assignBadge(userId);

    } catch (error) {
        console.error('Error updating leaderboard:', error);
    }
};

// Get leaderboard with proper user data
export const getLeaderboard = async (query = {}, sortBy = 'rating', limit = 50) => {
    try {
        const sortOrder = -1; // All sorts are descending for leaderboard
        
        const pipeline = [
            { $match: query },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: {
                    path: '$userDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    rating: 1,
                    solved: 1,
                    contests: 1,
                    winRate: 1,
                    updatedAt: 1, // For client-side time filtering
                    country: '$userDetails.country',
                    badge: '$userDetails.badge',
                    recentActivity: 1,
                    'user.username': '$userDetails.username',
                    'user.firstname': '$userDetails.firstname',
                    'user.lastname': '$userDetails.lastname',
                    'user._id': '$userDetails._id'
                }
            },
            { $sort: { [sortBy]: sortOrder } }
        ];

        // Conditionally add limit to the pipeline
        if (limit > 0) {
            pipeline.push({ $limit: limit });
        }
        
        const leaderboard = await Leaderboard.aggregate(pipeline);

        // Manually add rank
        return leaderboard.map((entry, index) => ({ ...entry, rank: index + 1 }));
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        throw error;
    }
}; 