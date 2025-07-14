import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(projectRoot, '.env') });

// Import models
import User from '../model/User.js';
import Problem from '../model/Problem.js';
import Contest from '../model/Contest.js';
import Submission from '../model/Submission.js';
import ContestResult from '../model/ContestResult.js';
import Leaderboard from '../model/Leaderboard.js';
import TestCase from '../model/TestCase.js';
import Discussion from '../model/Discussion.js';

// Import services and config
import { updateUserLeaderboard, updateLeaderboardOnContestEnd } from '../services/leaderboardService.js';
import { config } from '../config.js';
import { DBConnection } from "../database/db.js";

// ============================================================================
// SYSTEM ANALYSIS AND SETUP SCRIPT FOR ALGORAVE ONLINE JUDGE
// ============================================================================

class AlgoRaveAnalyzer {
    constructor() {
        this.analysis = {
            structure: {},
            statistics: {},
            recommendations: {},
            setup: {}
        };
    }

    // ============================================================================
    // SYSTEM STRUCTURE ANALYSIS
    // ============================================================================

    async analyzeSystemStructure() {
        console.log('\n🔍 ANALYZING SYSTEM STRUCTURE...\n');
        
        const projectRoot = path.resolve(__dirname, '../../');
        
        this.analysis.structure = {
            project: {
                name: 'AlgoRave Online Judge',
                architecture: 'Microservices with Monorepo',
                description: 'A comprehensive online coding platform with competitive programming features'
            },
            directories: {
                backend: {
                    purpose: 'Main API server with business logic',
                    components: [
                        'Express.js REST API',
                        'MongoDB with Mongoose ODM',
                        'JWT Authentication',
                        'Admin middleware',
                        'Leaderboard service',
                        'Database models'
                    ],
                    size: await this.getDirectorySize(path.join(projectRoot, 'backend')),
                    files: await this.countFiles(path.join(projectRoot, 'backend'))
                },
                'compiler-backend': {
                    purpose: 'Code execution engine',
                    components: [
                        'Multi-language support (C++, Java, Python)',
                        'Sandboxed execution',
                        'Memory and time monitoring',
                        'Test case validation'
                    ],
                    size: await this.getDirectorySize(path.join(projectRoot, 'compiler-backend')),
                    files: await this.countFiles(path.join(projectRoot, 'compiler-backend'))
                },
                frontend: {
                    purpose: 'React.js user interface',
                    components: [
                        'Modern React with hooks',
                        'Responsive design',
                        'Real-time compiler',
                        'Admin dashboard',
                        'Contest management',
                        'Leaderboard visualization'
                    ],
                    size: await this.getDirectorySize(path.join(projectRoot, 'frontend')),
                    files: await this.countFiles(path.join(projectRoot, 'frontend'))
                }
            },
            models: {
                User: 'User profiles, authentication, and statistics',
                Problem: 'Coding problems with test cases and metadata',
                Contest: 'Competitive programming contests',
                Submission: 'User code submissions and results',
                ContestResult: 'Contest participation and rankings',
                Leaderboard: 'Global and contest-specific rankings',
                TestCase: 'Problem test cases and validation',
                Discussion: 'Problem discussions and comments'
            },
            services: {
                leaderboardService: 'Rating calculations, badge assignments, and ranking updates'
            },
            middleware: {
                auth: 'JWT token validation',
                admin: 'Administrator access control'
            }
        };

        console.log('✅ System structure analysis completed');
    }

    // ============================================================================
    // DATABASE ANALYSIS
    // ============================================================================

    async analyzeDatabase() {
        console.log('\n📊 ANALYZING DATABASE...\n');
        
        try {
            await DBConnection();
            
            this.analysis.statistics = {
                users: await User.countDocuments(),
                problems: await Problem.countDocuments(),
                contests: await Contest.countDocuments(),
                submissions: await Submission.countDocuments(),
                contestResults: await ContestResult.countDocuments(),
                leaderboards: await Leaderboard.countDocuments(),
                testCases: await TestCase.countDocuments(),
                discussions: await Discussion.countDocuments()
            };

            // Analyze problem distribution
            const problemStats = await Problem.aggregate([
                {
                    $group: {
                        _id: '$difficulty',
                        count: { $sum: 1 },
                        avgTimeLimit: { $avg: '$timeLimit' },
                        avgMemoryLimit: { $avg: '$memoryLimit' }
                    }
                }
            ]);

            this.analysis.statistics.problemDistribution = problemStats;

            // Analyze user activity
            const userStats = await User.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProblemsSolved: { $sum: '$problemsSolved' },
                        avgProblemsSolved: { $avg: '$problemsSolved' },
                        maxProblemsSolved: { $max: '$problemsSolved' },
                        totalUsers: { $sum: 1 }
                    }
                }
            ]);

            this.analysis.statistics.userActivity = userStats[0] || {};

            console.log('✅ Database analysis completed');
        } catch (error) {
            console.error('❌ Database analysis failed:', error.message);
        }
    }

    // ============================================================================
    // SETUP AND INITIALIZATION
    // ============================================================================

    async setupDatabase() {
        console.log('\n🚀 SETTING UP DATABASE...\n');
        
        try {
            // Debug: Show the MongoDB URI being used
            console.log('🔍 MongoDB URI:', process.env.MONGODB_URI || 'Not found in .env');
            console.log('🔍 Config MongoDB URI:', config.MONGODB_URI);
            
            await DBConnection();
            console.log('✅ Connected to MongoDB');

            // Check if data already exists
            const existingUsers = await User.countDocuments();
            if (existingUsers > 0) {
                console.log('⚠️  Database already contains data. Skipping initialization.');
                return;
            }

            await this.createSampleUsers();
            await this.createSampleProblems();
            await this.createSampleContests();
            await this.createSampleSubmissions();
            await this.createSampleContestResults();
            await this.createTestCases();
            await this.initializeLeaderboards();
            await this.updateProblemSchema();

            console.log('✅ Database setup completed successfully!');
        } catch (error) {
            console.error('❌ Database setup failed:', error);
            throw error;
        }
    }

    async createSampleUsers() {
        console.log('👥 Creating sample users...');
        
        const hashedPassword = await bcrypt.hash('password123', 12);
        
        const users = [
            {
                username: 'alice_coder',
                firstname: 'Alice',
                lastname: 'Johnson',
                email: 'alice@example.com',
                password: hashedPassword,
                bio: 'Passionate about algorithms and competitive programming',
                college: 'MIT',
                country: 'USA',
                preferredLanguages: ['cpp', 'python'],
                badge: 'Algorithm Ace',
                problemsSolved: 25,
                problemsByTag: new Map([['easy', 10], ['medium', 12], ['hard', 3]])
            },
            {
                username: 'bob_hacker',
                firstname: 'Bob',
                lastname: 'Smith',
                email: 'bob@example.com',
                password: hashedPassword,
                bio: 'Love solving complex problems',
                college: 'Stanford',
                country: 'Canada',
                preferredLanguages: ['java', 'cpp'],
                badge: 'Problem Slayer',
                problemsSolved: 45,
                problemsByTag: new Map([['easy', 15], ['medium', 20], ['hard', 10]])
            },
            {
                username: 'charlie_dev',
                firstname: 'Charlie',
                lastname: 'Brown',
                email: 'charlie@example.com',
                password: hashedPassword,
                bio: 'Competitive programming enthusiast',
                college: 'Harvard',
                country: 'UK',
                preferredLanguages: ['python', 'javascript'],
                badge: 'Contest Conqueror',
                problemsSolved: 60,
                problemsByTag: new Map([['easy', 20], ['medium', 25], ['hard', 15]])
            },
            {
                username: 'diana_admin',
                firstname: 'Diana',
                lastname: 'Wilson',
                email: 'admin@algorave.com',
                password: hashedPassword,
                bio: 'System Administrator',
                college: 'UC Berkeley',
                country: 'USA',
                preferredLanguages: ['cpp', 'python', 'java'],
                badge: 'Grandmaster Coder',
                problemsSolved: 100,
                problemsByTag: new Map([['easy', 30], ['medium', 40], ['hard', 30]]),
                isAdmin: true
            },
            {
                username: 'emma_solver',
                firstname: 'Emma',
                lastname: 'Davis',
                email: 'emma@example.com',
                password: hashedPassword,
                bio: 'Data structures and algorithms expert',
                college: 'CMU',
                country: 'Germany',
                preferredLanguages: ['cpp', 'python', 'java'],
                badge: 'Code Novice',
                problemsSolved: 15,
                problemsByTag: new Map([['easy', 8], ['medium', 5], ['hard', 2]])
            }
        ];

        const createdUsers = [];
        for (const userData of users) {
            const existingUser = await User.findOne({ 
                $or: [{ email: userData.email }, { username: userData.username }] 
            });
            
            if (!existingUser) {
                const user = await User.create(userData);
                createdUsers.push(user);
                console.log(`✅ Created user: ${user.username}`);
            } else {
                createdUsers.push(existingUser);
                console.log(`⚠️  User already exists: ${existingUser.username}`);
            }
        }

        return createdUsers;
    }

    async createSampleProblems() {
        console.log('📝 Creating sample problems...');
        
        const users = await User.find();
        
        const problems = [
            {
                name: 'Two Sum',
                statement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
                code: 'TWOSUM',
                difficulty: 'easy',
                tags: ['arrays', 'hash-table'],
                timeLimit: 1000,
                memoryLimit: 64,
                createdBy: users[0]._id,
                inputFormat: 'The first line contains an integer n (2 ≤ n ≤ 104), the size of the array.\nThe second line contains n space-separated integers nums[i] (-109 ≤ nums[i] ≤ 109).\nThe third line contains an integer target (-109 ≤ target ≤ 109).',
                outputFormat: 'Print two space-separated integers representing the indices of the two numbers that add up to target.',
                constraints: '• 2 ≤ nums.length ≤ 104\n• -109 ≤ nums[i] ≤ 109\n• -109 ≤ target ≤ 109\n• Only one valid answer exists.',
                editorial: '**Solution Approach:**\n\nThis is a classic problem that can be solved efficiently using a hash map.\n\n**Algorithm:**\n1. Create a hash map to store numbers and their indices\n2. For each number, check if (target - current_number) exists in the map\n3. If found, return the current index and the stored index\n4. If not found, store the current number and its index\n\n**Time Complexity:** O(n) - we traverse the array only once\n**Space Complexity:** O(n) - in worst case, we store all numbers in the hash map\n\n**Key Insight:** Instead of using nested loops (O(n²)), we use a hash map to achieve O(n) time complexity.',
                samples: [
                    {
                        input: '[2,7,11,15]\n9',
                        output: '[0,1]',
                        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
                    },
                    {
                        input: '[3,2,4]\n6',
                        output: '[1,2]',
                        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
                    }
                ],
                isPublished: true
            },
            {
                name: 'Valid Parentheses',
                statement: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
                code: 'PAREN',
                difficulty: 'easy',
                tags: ['string', 'stack'],
                timeLimit: 1000,
                memoryLimit: 64,
                createdBy: users[0]._id,
                inputFormat: 'The first line contains a string s consisting only of parentheses characters.',
                outputFormat: 'Print "true" if the string is valid, "false" otherwise.',
                constraints: '• 1 ≤ s.length ≤ 104\n• s consists of parentheses only \'()[]{}\'',
                editorial: '**Solution Approach:**\n\nThis is a classic stack problem. We use a stack to keep track of opening brackets.\n\n**Algorithm:**\n1. Create an empty stack\n2. For each character in the string:\n   - If it\'s an opening bracket, push it to stack\n   - If it\'s a closing bracket:\n     * If stack is empty, return false\n     * If top of stack doesn\'t match, return false\n     * Otherwise, pop from stack\n3. Return true if stack is empty, false otherwise\n\n**Time Complexity:** O(n) - we traverse the string once\n**Space Complexity:** O(n) - in worst case, we store all opening brackets\n\n**Key Insight:** The stack naturally handles the LIFO (Last In, First Out) property of parentheses matching.',
                samples: [
                    {
                        input: '()',
                        output: 'true',
                        explanation: 'Simple valid parentheses: ()'
                    },
                    {
                        input: '()[]{}',
                        output: 'true',
                        explanation: 'Multiple valid parentheses: ()[]{}, all properly closed'
                    }
                ],
                isPublished: true
            },
            {
                name: 'Binary Tree Inorder Traversal',
                statement: 'Given the root of a binary tree, return the inorder traversal of its nodes values.',
                code: 'BTINORDER',
                difficulty: 'medium',
                tags: ['tree', 'depth-first-search'],
                timeLimit: 1000,
                memoryLimit: 64,
                createdBy: users[1]._id,
                inputFormat: 'The input is given as a binary tree in level order traversal format.\nEach line contains the values of nodes at that level, with null representing empty nodes.',
                outputFormat: 'Return an array of integers representing the inorder traversal of the tree.',
                constraints: '• The number of nodes in the tree is in the range [0, 100].\n• -100 ≤ Node.val ≤ 100',
                editorial: '**Solution Approach:**\n\nInorder traversal follows the pattern: Left → Root → Right\n\n**Recursive Solution:**\n1. If root is null, return empty list\n2. Recursively traverse left subtree\n3. Add root value to result\n4. Recursively traverse right subtree\n\n**Iterative Solution (using Stack):**\n1. Use a stack to keep track of nodes\n2. Push all left children to stack\n3. When no more left children, pop from stack and add to result\n4. Move to right child and repeat\n\n**Time Complexity:** O(n) - we visit each node exactly once\n**Space Complexity:** O(h) - where h is the height of the tree\n\n**Note:** The iterative solution is more space-efficient for skewed trees.',
                samples: [
                    {
                        input: '[1,null,2,3]',
                        output: '[1,3,2]',
                        explanation: 'Inorder traversal visits nodes in left-root-right order.'
                    },
                    {
                        input: '[1,2,3,4,5]',
                        output: '[4,2,5,1,3]',
                        explanation: 'Inorder traversal of a complete binary tree.'
                    }
                ],
                isPublished: true
            },
            {
                name: 'Longest Palindromic Substring',
                statement: 'Given a string s, return the longest palindromic substring in s.',
                code: 'LONGPAL',
                difficulty: 'hard',
                tags: ['string', 'dynamic-programming'],
                timeLimit: 1000,
                memoryLimit: 64,
                createdBy: users[2]._id,
                inputFormat: 'The first line contains a string s consisting of only lowercase English letters.',
                outputFormat: 'Print the longest palindromic substring. If there are multiple answers, print any one of them.',
                constraints: '• 1 ≤ s.length ≤ 1000\n• s consists of only lowercase English letters.',
                editorial: '**Solution Approach:**\n\nThis problem can be solved using dynamic programming or the expand around center approach.\n\n**Dynamic Programming Solution:**\n1. Create a 2D DP table where dp[i][j] represents if substring s[i...j] is palindrome\n2. Base cases: Single characters are palindromes, adjacent same characters are palindromes\n3. For length > 2: dp[i][j] = (s[i] == s[j]) && dp[i+1][j-1]\n4. Keep track of the longest palindrome found\n\n**Expand Around Center (More Efficient):**\n1. For each character, expand around it as center\n2. For each position, try both odd-length (single center) and even-length (two centers) palindromes\n3. Keep track of the longest palindrome found\n\n**Time Complexity:** O(n²) for both approaches\n**Space Complexity:** O(n²) for DP, O(1) for expand around center\n\n**Key Insight:** The expand around center approach is more space-efficient and easier to implement.',
                samples: [
                    {
                        input: '"babad"',
                        output: '"bab"',
                        explanation: 'The longest palindromic substring is "bab" (length 3).'
                    },
                    {
                        input: '"cbbd"',
                        output: '"bb"',
                        explanation: 'The longest palindromic substring is "bb" (length 2).'
                    }
                ],
                isPublished: true
            },
            {
                name: 'Merge k Sorted Lists',
                statement: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
                code: 'MERGEK',
                difficulty: 'hard',
                tags: ['linked-list', 'divide-and-conquer', 'heap'],
                timeLimit: 1000,
                memoryLimit: 64,
                createdBy: users[2]._id,
                inputFormat: 'The first line contains an integer k (1 ≤ k ≤ 104), the number of linked lists.\nEach of the next k lines contains a space-separated list of integers representing a sorted linked list.',
                outputFormat: 'Print the merged sorted linked list as space-separated integers.',
                constraints: '• k == lists.length\n• 0 ≤ k ≤ 104\n• 0 ≤ lists[i].length ≤ 500\n• -104 ≤ lists[i][j] ≤ 104\n• lists[i] is sorted in ascending order.',
                editorial: '**Solution Approach:**\n\nThis problem can be solved using a min-heap (priority queue) or divide-and-conquer approach.\n\n**Min-Heap Solution:**\n1. Create a min-heap and add the first node from each list\n2. While heap is not empty:\n   - Extract minimum node from heap\n   - Add it to result list\n   - Add next node from the same list to heap\n3. Return the merged list\n\n**Divide-and-Conquer Solution:**\n1. Merge lists in pairs until only one list remains\n2. Use the merge two sorted lists algorithm for each pair\n3. Continue until all lists are merged\n\n**Time Complexity:** O(n log k) for heap approach, O(n log k) for divide-and-conquer\n**Space Complexity:** O(k) for heap approach, O(log k) for divide-and-conquer\n\n**Key Insight:** The heap approach is more intuitive, while divide-and-conquer is more space-efficient.',
                samples: [
                    {
                        input: '[[1,4,5],[1,3,4],[2,6]]',
                        output: '[1,1,2,3,4,4,5,6]',
                        explanation: 'Merging the three sorted lists.'
                    },
                    {
                        input: '[[1,3,5],[2,4,6]]',
                        output: '[1,2,3,4,5,6]',
                        explanation: 'Merging two sorted lists.'
                    }
                ],
                isPublished: true
            },
            {
                name: 'Reverse Integer',
                statement: 'Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-231, 231 - 1], then return 0.',
                code: 'REVINT',
                difficulty: 'easy',
                tags: ['math'],
                timeLimit: 1000,
                memoryLimit: 64,
                createdBy: users[3]._id,
                inputFormat: 'The first line contains an integer x.',
                outputFormat: 'Print the reversed integer.',
                constraints: '• -231 ≤ x ≤ 231 - 1',
                editorial: '**Solution Approach:**\n\nWe can reverse the digits by repeatedly extracting the last digit and building the reversed number.\n\n**Algorithm:**\n1. Initialize result as 0\n2. While x is not 0:\n   - Extract last digit: digit = x % 10\n   - Update result: result = result * 10 + digit\n   - Remove last digit: x = x / 10\n3. Check for overflow and return appropriate value\n\n**Time Complexity:** O(log n) - we process each digit once\n**Space Complexity:** O(1) - we use constant extra space\n\n**Key Insight:** Handle overflow carefully by checking bounds before updating the result.',
                samples: [
                    {
                        input: '123',
                        output: '321',
                        explanation: 'Reversing 123 gives 321.'
                    },
                    {
                        input: '-123',
                        output: '-321',
                        explanation: 'Reversing -123 gives -321 (negative numbers).'
                    }
                ],
                isPublished: true
            },
            {
                name: 'Container With Most Water',
                statement: 'Given n non-negative integers height where each represents a point at coordinate (i, height[i]), find two lines that together with the x-axis form a container that would hold the maximum amount of water.',
                code: 'CONTAINER',
                difficulty: 'medium',
                tags: ['array', 'two-pointers'],
                timeLimit: 1000,
                memoryLimit: 64,
                createdBy: users[3]._id,
                inputFormat: 'The first line contains an integer n (2 ≤ n ≤ 105), the number of heights.\nThe second line contains n space-separated integers height[i] (0 ≤ height[i] ≤ 104).',
                outputFormat: 'Print the maximum area of water that can be contained.',
                constraints: '• n == height.length\n• 2 ≤ n ≤ 105\n• 0 ≤ height[i] ≤ 104',
                editorial: '**Solution Approach:**\n\nThis problem can be solved using the two-pointer technique.\n\n**Algorithm:**\n1. Use two pointers, left and right, starting from both ends\n2. Calculate area: min(height[left], height[right]) * (right - left)\n3. Move the pointer with smaller height inward\n4. Keep track of maximum area found\n\n**Time Complexity:** O(n) - we traverse the array once\n**Space Complexity:** O(1) - we use constant extra space\n\n**Key Insight:** Moving the pointer with smaller height is optimal because the width will decrease, so we need to try to increase the height.',
                samples: [
                    {
                        input: '[1,8,6,2,5,4,8,3,7]',
                        output: '49',
                        explanation: 'Maximum area = min(8,7) * (8-1) = 7 * 7 = 49'
                    },
                    {
                        input: '[1,1]',
                        output: '1',
                        explanation: 'Maximum area = min(1,1) * (1-0) = 1 * 1 = 1'
                    }
                ],
                isPublished: true
            },
            {
                name: 'Regular Expression Matching',
                statement: 'Given an input string s and a pattern p, implement regular expression matching with support for \'.\' and \'*\'.',
                code: 'REGEX',
                difficulty: 'hard',
                tags: ['string', 'dynamic-programming'],
                timeLimit: 1000,
                memoryLimit: 64,
                createdBy: users[4]._id,
                inputFormat: 'The first line contains a string s.\nThe second line contains a pattern p.',
                outputFormat: 'Print "true" if s matches p, "false" otherwise.',
                constraints: '• 1 ≤ s.length ≤ 20\n• 1 ≤ p.length ≤ 30\n• s contains only lowercase English letters\n• p contains only lowercase English letters, \'.\', and \'*\'',
                editorial: '**Solution Approach:**\n\nThis problem can be solved using dynamic programming.\n\n**Algorithm:**\n1. Create a 2D DP table where dp[i][j] represents if s[0...i-1] matches p[0...j-1]\n2. Base cases:\n   - Empty string matches empty pattern\n   - Empty string matches pattern with only \'*\' characters\n3. For each character:\n   - If characters match or pattern has \'.\', check previous state\n   - If pattern has \'*\', check zero or more occurrences\n\n**Time Complexity:** O(mn) where m and n are lengths of s and p\n**Space Complexity:** O(mn) for the DP table\n\n**Key Insight:** The \'*\' character can match zero or more of the preceding element.',
                samples: [
                    {
                        input: '"aa"\n"a"',
                        output: 'false',
                        explanation: 'Pattern "a" only matches one character, not the entire string "aa"'
                    },
                    {
                        input: '"aa"\n"a*"',
                        output: 'true',
                        explanation: 'Pattern "a*" matches zero or more \'a\'s, so it matches "aa"'
                    }
                ],
                isPublished: true
            },
            {
                name: 'Add Two Numbers',
                statement: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.',
                code: 'ADDTWO',
                difficulty: 'medium',
                tags: ['linked-list', 'math'],
                timeLimit: 1000,
                memoryLimit: 64,
                createdBy: users[4]._id,
                inputFormat: 'The first line contains two space-separated integers representing the first number.\nThe second line contains two space-separated integers representing the second number.',
                outputFormat: 'Print the sum as space-separated integers in reverse order.',
                constraints: '• The number of nodes in each linked list is in the range [1, 100].\n• 0 ≤ Node.val ≤ 9\n• It is guaranteed that the list represents a number that does not have leading zeros.',
                editorial: '**Solution Approach:**\n\nWe can add the numbers digit by digit, keeping track of the carry.\n\n**Algorithm:**\n1. Initialize a dummy head for the result list\n2. Traverse both lists simultaneously\n3. Add corresponding digits and carry from previous addition\n4. Create new node with sum % 10 and update carry = sum / 10\n5. Handle remaining digits and final carry\n\n**Time Complexity:** O(max(m, n)) where m and n are lengths of the lists\n**Space Complexity:** O(max(m, n)) for the result list\n\n**Key Insight:** The reverse order makes it easier to add from least significant digit to most significant digit.',
                samples: [
                    {
                        input: '[2,4,3]\n[5,6,4]',
                        output: '[7,0,8]',
                        explanation: '342 + 465 = 807, represented as [7,0,8]'
                    },
                    {
                        input: '[0]\n[0]',
                        output: '[0]',
                        explanation: '0 + 0 = 0, represented as [0]'
                    }
                ],
                isPublished: true
            },
            {
                name: 'Median of Two Sorted Arrays',
                statement: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.',
                code: 'MEDIAN',
                difficulty: 'hard',
                tags: ['array', 'binary-search'],
                timeLimit: 1000,
                memoryLimit: 64,
                createdBy: users[0]._id,
                inputFormat: 'The first line contains two space-separated integers m and n.\nThe second line contains m space-separated integers representing nums1.\nThe third line contains n space-separated integers representing nums2.',
                outputFormat: 'Print the median of the two sorted arrays.',
                constraints: '• nums1.length == m\n• nums2.length == n\n• 0 ≤ m ≤ 1000\n• 0 ≤ n ≤ 1000\n• 1 ≤ m + n ≤ 2000\n• -106 ≤ nums1[i], nums2[i] ≤ 106',
                editorial: '**Solution Approach:**\n\nThis problem can be solved using binary search to find the correct partition.\n\n**Algorithm:**\n1. Ensure nums1 is the smaller array\n2. Use binary search on the smaller array to find the correct partition\n3. Calculate the partition for the larger array\n4. Check if the partition is correct by comparing elements around the partition\n5. Calculate median based on the partition\n\n**Time Complexity:** O(log(min(m, n)))\n**Space Complexity:** O(1)\n\n**Key Insight:** The median divides the combined array into two equal halves, and we can find this partition using binary search.',
                samples: [
                    {
                        input: '[1,3]\n[2]',
                        output: '2.0',
                        explanation: 'Merged array: [1,2,3], median = 2.0'
                    },
                    {
                        input: '[1,2]\n[3,4]',
                        output: '2.5',
                        explanation: 'Merged array: [1,2,3,4], median = (2+3)/2 = 2.5'
                    }
                ],
                isPublished: true
            }
        ];

        const createdProblems = [];
        for (const problemData of problems) {
            const existingProblem = await Problem.findOne({ code: problemData.code });
            
            if (!existingProblem) {
                const problem = await Problem.create(problemData);
                createdProblems.push(problem);
                console.log(`✅ Created problem: ${problem.name} (${problem.code})`);
            } else {
                createdProblems.push(existingProblem);
                console.log(`⚠️  Problem already exists: ${existingProblem.name} (${existingProblem.code})`);
            }
        }

        return createdProblems;
    }

    async createSampleContests() {
        console.log('🏆 Creating sample contests...');
        
        const users = await User.find();
        const problems = await Problem.find();
        
        const contests = [
            {
                title: 'Weekly Algorithm Challenge',
                description: 'A weekly contest featuring algorithmic problems of varying difficulty.',
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                durationMinutes: 120,
                difficulty: 'medium',
                type: 'rated',
                prizes: ['$100', '$50', '$25'],
                problems: [problems[0]._id, problems[1]._id, problems[2]._id],
                createdBy: users[0]._id,
                status: 'upcoming',
                participants: 0
            },
            {
                title: 'Advanced Data Structures',
                description: 'Contest focused on advanced data structures and algorithms.',
                startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                endTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                durationMinutes: 180,
                difficulty: 'hard',
                type: 'rated',
                prizes: ['$200', '$100', '$50'],
                problems: [problems[2]._id, problems[3]._id, problems[4]._id],
                createdBy: users[1]._id,
                status: 'past',
                participants: 4
            },
            {
                title: 'Beginner Friendly Contest',
                description: 'Perfect for newcomers to competitive programming.',
                startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                durationMinutes: 90,
                difficulty: 'easy',
                type: 'practice',
                prizes: ['$50', '$25', '$10'],
                problems: [problems[0]._id, problems[1]._id, problems[5]._id, problems[6]._id],
                createdBy: users[2]._id,
                status: 'upcoming',
                participants: 0
            }
        ];

        const createdContests = [];
        for (const contestData of contests) {
            const existingContest = await Contest.findOne({ title: contestData.title });
            
            if (!existingContest) {
                const contest = await Contest.create(contestData);
                createdContests.push(contest);
                console.log(`✅ Created contest: ${contest.title}`);
            } else {
                createdContests.push(existingContest);
                console.log(`⚠️  Contest already exists: ${existingContest.title}`);
            }
        }

        return createdContests;
    }

    async createSampleSubmissions() {
        console.log('📤 Creating sample submissions...');
        
        const users = await User.find();
        const problems = await Problem.find();
        
        const submissions = [];
        for (let i = 0; i < users.length; i++) {
            for (let j = 0; j < problems.length; j++) {
                const isAccepted = Math.random() > 0.3; // 70% acceptance rate
                submissions.push({
                    user: users[i]._id,
                    problem: problems[j]._id,
                    language: ["cpp", "python", "java"][Math.floor(Math.random() * 3)],
                    code: `# Sample solution for ${problems[j].name}`,
                    status: isAccepted ? "accepted" : "wrong_answer",
                    executionTime: Math.floor(Math.random() * 1000),
                    memoryUsed: Math.floor(Math.random() * 100) + 10,
                    testCasesPassed: isAccepted ? 10 : Math.floor(Math.random() * 9),
                    totalTestCases: 10,
                    score: isAccepted ? 100 : 0
                });
            }
        }

        await Submission.insertMany(submissions);
        console.log(`✅ Created ${submissions.length} submissions`);
    }

    async createSampleContestResults() {
        console.log('🏅 Creating sample contest results...');
        
        const users = await User.find();
        const contests = await Contest.find({ status: 'past' });
        
        if (contests.length === 0) {
            console.log('⚠️  No past contests found for creating results');
            return;
        }

        const contestResults = [
            {
                user: users[0]._id,
                contest: contests[0]._id,
                problemsSolved: 3,
                totalProblems: 3,
                score: 95,
                rank: 1,
                timeTaken: 120,
                participated: true,
                disqualified: false
            },
            {
                user: users[1]._id,
                contest: contests[0]._id,
                problemsSolved: 2,
                totalProblems: 3,
                score: 85,
                rank: 2,
                timeTaken: 150,
                participated: true,
                disqualified: false
            },
            {
                user: users[2]._id,
                contest: contests[0]._id,
                problemsSolved: 2,
                totalProblems: 3,
                score: 80,
                rank: 3,
                timeTaken: 160,
                participated: true,
                disqualified: false
            }
        ];

        await ContestResult.insertMany(contestResults);
        console.log(`✅ Created ${contestResults.length} contest results`);
    }

    async createTestCases() {
        console.log('🧪 Creating test cases...');
        
        const problems = await Problem.find();
        
        const testCases = [
            // Two Sum (TWOSUM) - 2 additional test cases
            {
                problem: problems[0]._id,
                input: '[1,2,3,4,5]\n9',
                output: '[3,4]',
                isSample: false,
                index: 1
            },
            {
                problem: problems[0]._id,
                input: '[0,4,3,0]\n0',
                output: '[0,3]',
                isSample: false,
                index: 2
            },
            
            // Valid Parentheses (PAREN) - 2 additional test cases
            {
                problem: problems[1]._id,
                input: '(]',
                output: 'false',
                isSample: false,
                index: 1
            },
            {
                problem: problems[1]._id,
                input: '([)]',
                output: 'false',
                isSample: false,
                index: 2
            },
            
            // Binary Tree Inorder Traversal (BTINORDER) - 2 additional test cases
            {
                problem: problems[2]._id,
                input: '[1,2,3,4,5,6,7]',
                output: '[4,2,5,1,6,3,7]',
                isSample: false,
                index: 1
            },
            {
                problem: problems[2]._id,
                input: '[1]',
                output: '[1]',
                isSample: false,
                index: 2
            },
            
            // Longest Palindromic Substring (LONGPAL) - 2 additional test cases
            {
                problem: problems[3]._id,
                input: '"racecar"',
                output: '"racecar"',
                isSample: false,
                index: 1
            },
            {
                problem: problems[3]._id,
                input: '"abba"',
                output: '"abba"',
                isSample: false,
                index: 2
            },
            
            // Merge k Sorted Lists (MERGEK) - 2 additional test cases
            {
                problem: problems[4]._id,
                input: '[[1,2,3],[4,5,6],[7,8,9]]',
                output: '[1,2,3,4,5,6,7,8,9]',
                isSample: false,
                index: 1
            },
            {
                problem: problems[4]._id,
                input: '[[1],[2],[3]]',
                output: '[1,2,3]',
                isSample: false,
                index: 2
            },
            
            // Reverse Integer (REVINT) - 2 additional test cases
            {
                problem: problems[5]._id,
                input: '120',
                output: '21',
                isSample: false,
                index: 1
            },
            {
                problem: problems[5]._id,
                input: '-2147483648',
                output: '0',
                isSample: false,
                index: 2
            },
            
            // Container With Most Water (CONTAINER) - 2 additional test cases
            {
                problem: problems[6]._id,
                input: '[4,3,2,1,4]',
                output: '16',
                isSample: false,
                index: 1
            },
            {
                problem: problems[6]._id,
                input: '[3,1,2,4,5]',
                output: '12',
                isSample: false,
                index: 2
            },
            
            // Regular Expression Matching (REGEX) - 2 additional test cases
            {
                problem: problems[7]._id,
                input: '"ab"\n".*"',
                output: 'true',
                isSample: false,
                index: 1
            },
            {
                problem: problems[7]._id,
                input: '"aab"\n"c*a*b"',
                output: 'true',
                isSample: false,
                index: 2
            },
            
            // Add Two Numbers (ADDTWO) - 2 additional test cases
            {
                problem: problems[8]._id,
                input: '[9,9,9,9,9,9,9]\n[9,9,9,9]',
                output: '[8,9,9,9,0,0,0,1]',
                isSample: false,
                index: 1
            },
            {
                problem: problems[8]._id,
                input: '[1,2,3]\n[4,5,6]',
                output: '[5,7,9]',
                isSample: false,
                index: 2
            },
            
            // Median of Two Sorted Arrays (MEDIAN) - 2 additional test cases
            {
                problem: problems[9]._id,
                input: '[1,2]\n[3,4]',
                output: '2.5',
                isSample: false,
                index: 1
            },
            {
                problem: problems[9]._id,
                input: '[1,3,5]\n[2,4,6]',
                output: '3.5',
                isSample: false,
                index: 2
            }
        ];

        await TestCase.insertMany(testCases);
        console.log(`✅ Created ${testCases.length} additional test cases`);
    }

    async initializeLeaderboards() {
        console.log('📊 Initializing leaderboards...');
        
        const users = await User.find();
        
        for (const user of users) {
            await updateUserLeaderboard(user._id);
        }
        
        console.log(`✅ Updated leaderboards for ${users.length} users`);
    }

    async updateProblemSchema() {
        console.log('🔧 Updating problem schema...');
        
        // Update all existing problems to have isPublished: true and add format fields if they don't exist
        const result = await Problem.updateMany(
            { isPublished: { $exists: false } },
            { 
                $set: { 
                    isPublished: true,
                    inputFormat: "",
                    outputFormat: "",
                    constraints: "",
                    editorial: ""
                } 
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} problems with isPublished and format fields`);

        // Also update problems that might have isPublished but missing format fields
        const result2 = await Problem.updateMany(
            { 
                $or: [
                    { inputFormat: { $exists: false } },
                    { outputFormat: { $exists: false } },
                    { constraints: { $exists: false } },
                    { editorial: { $exists: false } }
                ]
            },
            { 
                $set: { 
                    inputFormat: "",
                    outputFormat: "",
                    constraints: "",
                    editorial: ""
                } 
            }
        );

        console.log(`✅ Updated ${result2.modifiedCount} problems with missing format fields`);
    }

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    async getDirectorySize(dirPath) {
        try {
            const stats = fs.statSync(dirPath);
            if (stats.isFile()) {
                return stats.size;
            }
            
            const files = fs.readdirSync(dirPath);
            let totalSize = 0;
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                totalSize += await this.getDirectorySize(filePath);
            }
            
            return totalSize;
        } catch (error) {
            return 0;
        }
    }

    async countFiles(dirPath) {
        try {
            const files = fs.readdirSync(dirPath);
            let count = 0;
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    count += await this.countFiles(filePath);
                } else {
                    count++;
                }
            }
            
            return count;
        } catch (error) {
            return 0;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // ============================================================================
    // REPORT GENERATION
    // ============================================================================

    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📋 ALGORAVE ONLINE JUDGE - COMPREHENSIVE ANALYSIS REPORT');
        console.log('='.repeat(80));

        // System Overview
        console.log('\n🏗️  SYSTEM ARCHITECTURE');
        console.log('-'.repeat(40));
        console.log(`Project: ${this.analysis.structure.project.name}`);
        console.log(`Architecture: ${this.analysis.structure.project.architecture}`);
        console.log(`Description: ${this.analysis.structure.project.description}`);

        // Directory Analysis
        console.log('\n📁 DIRECTORY STRUCTURE');
        console.log('-'.repeat(40));
        for (const [dir, info] of Object.entries(this.analysis.structure.directories)) {
            console.log(`\n${dir.toUpperCase()}:`);
            console.log(`  Purpose: ${info.purpose}`);
            console.log(`  Size: ${this.formatBytes(info.size)}`);
            console.log(`  Files: ${info.files}`);
            console.log(`  Components:`);
            info.components.forEach(comp => console.log(`    • ${comp}`));
        }

        // Database Statistics
        console.log('\n📊 DATABASE STATISTICS');
        console.log('-'.repeat(40));
        for (const [model, count] of Object.entries(this.analysis.statistics)) {
            if (typeof count === 'number') {
                console.log(`${model}: ${count} records`);
            }
        }

        if (this.analysis.statistics.problemDistribution) {
            console.log('\nProblem Distribution by Difficulty:');
            this.analysis.statistics.problemDistribution.forEach(stat => {
                console.log(`  ${stat._id}: ${stat.count} problems (avg time: ${Math.round(stat.avgTimeLimit)}ms, avg memory: ${Math.round(stat.avgMemoryLimit)}MB)`);
            });
        }

        if (this.analysis.statistics.userActivity) {
            console.log('\nUser Activity Summary:');
            const activity = this.analysis.statistics.userActivity;
            console.log(`  Total users: ${activity.totalUsers}`);
            console.log(`  Total problems solved: ${activity.totalProblemsSolved}`);
            console.log(`  Average problems per user: ${Math.round(activity.avgProblemsSolved)}`);
            console.log(`  Most problems solved by one user: ${activity.maxProblemsSolved}`);
        }

        // Model Relationships
        console.log('\n🔗 DATA MODEL RELATIONSHIPS');
        console.log('-'.repeat(40));
        for (const [model, description] of Object.entries(this.analysis.structure.models)) {
            console.log(`${model}: ${description}`);
        }

        // Services and Middleware
        console.log('\n⚙️  SERVICES & MIDDLEWARE');
        console.log('-'.repeat(40));
        for (const [service, description] of Object.entries(this.analysis.structure.services)) {
            console.log(`${service}: ${description}`);
        }
        for (const [middleware, description] of Object.entries(this.analysis.structure.middleware)) {
            console.log(`${middleware}: ${description}`);
        }

        // Recommendations
        console.log('\n💡 RECOMMENDATIONS');
        console.log('-'.repeat(40));
        console.log('• Consider adding more test cases for each problem');
        console.log('• Implement rate limiting for code submissions');
        console.log('• Add more contest types (team contests, educational contests)');
        console.log('• Consider implementing a caching layer for frequently accessed data');
        console.log('• Add monitoring and logging for better system observability');
        console.log('• Implement automated backup strategies for the database');

        // Setup Instructions
        console.log('\n🚀 SETUP INSTRUCTIONS');
        console.log('-'.repeat(40));
        console.log('1. Start the backend server: cd backend && npm start');
        console.log('2. Start the compiler backend: cd compiler-backend && npm start');
        console.log('3. Start the frontend: cd frontend && npm start');
        console.log('4. Access the application at: https://algorave.me');
        console.log('5. Admin login: admin@algorave.com / password123');

        console.log('\n' + '='.repeat(80));
        console.log('✅ ANALYSIS COMPLETE - ALGORAVE ONLINE JUDGE IS READY!');
        console.log('='.repeat(80));
    }

    // ============================================================================
    // MAIN EXECUTION
    // ============================================================================

    async run() {
        try {
            console.log('🚀 Starting AlgoRave Online Judge Analysis and Setup...\n');
            
            // Analyze system structure
            await this.analyzeSystemStructure();
            
            // Setup database (if needed)
            await this.setupDatabase();
            
            // Analyze database
            await this.analyzeDatabase();
            
            // Generate comprehensive report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            process.exit(1);
        }
    }
}

// Run the analyzer
const analyzer = new AlgoRaveAnalyzer();
analyzer.run(); 