"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const database_1 = require("../backend/utils/database");
const models_1 = require("../backend/models");
// Sample test data with questions for different classes and subjects
const sampleTestsData = {
    Mathematics: {
        5: [
            {
                title: 'Basic Arithmetic - Addition and Subtraction',
                chapter: 'Numbers and Operations',
                questions: [
                    {
                        question: 'What is 25 + 37?',
                        options: [
                            { text: '52', isCorrect: false },
                            { text: '62', isCorrect: true },
                            { text: '72', isCorrect: false },
                            { text: '82', isCorrect: false }
                        ],
                        explanation: '25 + 37 = 62. Add the units place: 5 + 7 = 12, write 2 and carry 1. Add the tens place: 2 + 3 + 1 = 6.',
                        difficulty: 'easy'
                    },
                    {
                        question: 'What is 100 - 45?',
                        options: [
                            { text: '45', isCorrect: false },
                            { text: '55', isCorrect: true },
                            { text: '65', isCorrect: false },
                            { text: '75', isCorrect: false }
                        ],
                        explanation: '100 - 45 = 55. Subtract from right to left, borrowing when necessary.',
                        difficulty: 'easy'
                    },
                    {
                        question: 'Which of the following are factors of 12?',
                        options: [
                            { text: '1, 2, 3, 4', isCorrect: true },
                            { text: '2, 4, 6, 8', isCorrect: false },
                            { text: '1, 3, 5, 7', isCorrect: false },
                            { text: '2, 3, 5, 7', isCorrect: false }
                        ],
                        explanation: 'Factors of 12 are numbers that divide 12 evenly: 1, 2, 3, 4, 6, and 12.',
                        difficulty: 'medium',
                        questionType: 'multiple-choice'
                    }
                ]
            },
            {
                title: 'Geometry Basics - Shapes and Patterns',
                chapter: 'Geometry',
                questions: [
                    {
                        question: 'How many sides does a pentagon have?',
                        options: [
                            { text: '4', isCorrect: false },
                            { text: '5', isCorrect: true },
                            { text: '6', isCorrect: false },
                            { text: '7', isCorrect: false }
                        ],
                        explanation: 'A pentagon is a five-sided polygon.',
                        difficulty: 'easy'
                    },
                    {
                        question: 'What is the perimeter of a rectangle with length 8 cm and width 5 cm?',
                        options: [
                            { text: '13 cm', isCorrect: false },
                            { text: '26 cm', isCorrect: true },
                            { text: '40 cm', isCorrect: false },
                            { text: '18 cm', isCorrect: false }
                        ],
                        explanation: 'Perimeter = 2 × (length + width) = 2 × (8 + 5) = 2 × 13 = 26 cm.',
                        difficulty: 'medium'
                    }
                ]
            }
        ],
        6: [
            {
                title: 'Fractions and Decimals',
                chapter: 'Fractions',
                questions: [
                    {
                        question: 'What is 3/4 + 1/4?',
                        options: [
                            { text: '4/8', isCorrect: false },
                            { text: '1', isCorrect: true },
                            { text: '4/4', isCorrect: false },
                            { text: '3/8', isCorrect: false }
                        ],
                        explanation: '3/4 + 1/4 = (3+1)/4 = 4/4 = 1',
                        difficulty: 'easy'
                    },
                    {
                        question: 'Convert 0.75 to a fraction in simplest form.',
                        options: [
                            { text: '75/100', isCorrect: false },
                            { text: '3/4', isCorrect: true },
                            { text: '7/5', isCorrect: false },
                            { text: '15/20', isCorrect: false }
                        ],
                        explanation: '0.75 = 75/100 = 3/4 (dividing both numerator and denominator by 25)',
                        difficulty: 'medium'
                    }
                ]
            }
        ],
        7: [
            {
                title: 'Integers and Rational Numbers',
                chapter: 'Number System',
                questions: [
                    {
                        question: 'What is (-5) + (+3)?',
                        options: [
                            { text: '-8', isCorrect: false },
                            { text: '-2', isCorrect: true },
                            { text: '+2', isCorrect: false },
                            { text: '+8', isCorrect: false }
                        ],
                        explanation: 'When adding integers with different signs, subtract and take the sign of the larger absolute value: |-5| - |+3| = 5 - 3 = 2, with negative sign.',
                        difficulty: 'medium'
                    },
                    {
                        question: 'Solve: 2x + 5 = 15',
                        options: [
                            { text: 'x = 5', isCorrect: true },
                            { text: 'x = 10', isCorrect: false },
                            { text: 'x = 7.5', isCorrect: false },
                            { text: 'x = 20', isCorrect: false }
                        ],
                        explanation: '2x + 5 = 15 → 2x = 15 - 5 → 2x = 10 → x = 5',
                        difficulty: 'hard'
                    }
                ]
            }
        ],
        8: [
            {
                title: 'Linear Equations and Mensuration',
                chapter: 'Algebra',
                questions: [
                    {
                        question: 'What is the area of a circle with radius 7 cm? (π ≈ 3.14)',
                        options: [
                            { text: '49 sq cm', isCorrect: false },
                            { text: '153.86 sq cm', isCorrect: true },
                            { text: '43.96 sq cm', isCorrect: false },
                            { text: '21.98 sq cm', isCorrect: false }
                        ],
                        explanation: 'Area = πr² = 3.14 × 7² = 3.14 × 49 = 153.86 sq cm',
                        difficulty: 'medium'
                    }
                ]
            }
        ],
        9: [
            {
                title: 'Polynomials and Coordinate Geometry',
                chapter: 'Algebra',
                questions: [
                    {
                        question: 'What is the degree of polynomial 3x³ + 2x² - 5x + 1?',
                        options: [
                            { text: '1', isCorrect: false },
                            { text: '2', isCorrect: false },
                            { text: '3', isCorrect: true },
                            { text: '4', isCorrect: false }
                        ],
                        explanation: 'The degree of a polynomial is the highest power of the variable. Here, the highest power is 3.',
                        difficulty: 'easy'
                    }
                ]
            }
        ],
        10: [
            {
                title: 'Trigonometry and Statistics',
                chapter: 'Trigonometry',
                questions: [
                    {
                        question: 'What is the value of sin 90°?',
                        options: [
                            { text: '0', isCorrect: false },
                            { text: '1', isCorrect: true },
                            { text: '√3/2', isCorrect: false },
                            { text: '1/2', isCorrect: false }
                        ],
                        explanation: 'sin 90° = 1. This is a standard trigonometric value.',
                        difficulty: 'easy'
                    },
                    {
                        question: 'In a right triangle, if one angle is 30°, what are the other two angles?',
                        options: [
                            { text: '60° and 90°', isCorrect: true },
                            { text: '45° and 105°', isCorrect: false },
                            { text: '30° and 120°', isCorrect: false },
                            { text: '70° and 80°', isCorrect: false }
                        ],
                        explanation: 'In a triangle, the sum of all angles is 180°. In a right triangle, one angle is 90°. So the other two must sum to 90°. If one is 30°, the other is 60°.',
                        difficulty: 'medium'
                    }
                ]
            }
        ]
    },
    Science: {
        5: [
            {
                title: 'Living and Non-Living Things',
                chapter: 'Our Environment',
                questions: [
                    {
                        question: 'Which of the following is a characteristic of living things?',
                        options: [
                            { text: 'They can move', isCorrect: false },
                            { text: 'They can grow', isCorrect: true },
                            { text: 'They are made of metal', isCorrect: false },
                            { text: 'They never change', isCorrect: false }
                        ],
                        explanation: 'Growth is a fundamental characteristic of all living things.',
                        difficulty: 'easy'
                    },
                    {
                        question: 'What do plants need to make their food?',
                        options: [
                            { text: 'Sunlight and water only', isCorrect: false },
                            { text: 'Sunlight, water, and carbon dioxide', isCorrect: true },
                            { text: 'Only carbon dioxide', isCorrect: false },
                            { text: 'Soil and minerals only', isCorrect: false }
                        ],
                        explanation: 'Plants need sunlight, water, and carbon dioxide to carry out photosynthesis and make their food.',
                        difficulty: 'medium'
                    }
                ]
            }
        ],
        6: [
            {
                title: 'Food and Nutrition',
                chapter: 'Food',
                questions: [
                    {
                        question: 'Which vitamin is produced when our skin is exposed to sunlight?',
                        options: [
                            { text: 'Vitamin A', isCorrect: false },
                            { text: 'Vitamin B', isCorrect: false },
                            { text: 'Vitamin C', isCorrect: false },
                            { text: 'Vitamin D', isCorrect: true }
                        ],
                        explanation: 'Vitamin D is synthesized in our skin when exposed to sunlight.',
                        difficulty: 'medium'
                    }
                ]
            }
        ],
        7: [
            {
                title: 'Acids, Bases and Salts',
                chapter: 'Chemistry',
                questions: [
                    {
                        question: 'What happens when you add lemon juice to baking soda?',
                        options: [
                            { text: 'Nothing happens', isCorrect: false },
                            { text: 'It produces bubbles', isCorrect: true },
                            { text: 'It becomes very hot', isCorrect: false },
                            { text: 'It changes color to red', isCorrect: false }
                        ],
                        explanation: 'Lemon juice (acid) reacts with baking soda (base) to produce carbon dioxide gas, which creates bubbles.',
                        difficulty: 'easy'
                    }
                ]
            }
        ],
        8: [
            {
                title: 'Force and Pressure',
                chapter: 'Physics',
                questions: [
                    {
                        question: 'What is the SI unit of force?',
                        options: [
                            { text: 'Kilogram', isCorrect: false },
                            { text: 'Newton', isCorrect: true },
                            { text: 'Meter', isCorrect: false },
                            { text: 'Pascal', isCorrect: false }
                        ],
                        explanation: 'The SI unit of force is Newton, named after Sir Isaac Newton.',
                        difficulty: 'easy'
                    }
                ]
            }
        ],
        9: [
            {
                title: 'Gravitation and Motion',
                chapter: 'Physics',
                questions: [
                    {
                        question: 'What is the acceleration due to gravity on Earth?',
                        options: [
                            { text: '9.8 m/s²', isCorrect: true },
                            { text: '10.8 m/s²', isCorrect: false },
                            { text: '8.9 m/s²', isCorrect: false },
                            { text: '11.2 m/s²', isCorrect: false }
                        ],
                        explanation: 'The standard acceleration due to gravity on Earth is approximately 9.8 m/s².',
                        difficulty: 'medium'
                    }
                ]
            }
        ],
        10: [
            {
                title: 'Carbon and its Compounds',
                chapter: 'Chemistry',
                questions: [
                    {
                        question: 'What is the molecular formula of methane?',
                        options: [
                            { text: 'CH₂', isCorrect: false },
                            { text: 'CH₄', isCorrect: true },
                            { text: 'C₂H₆', isCorrect: false },
                            { text: 'CO₂', isCorrect: false }
                        ],
                        explanation: 'Methane has the molecular formula CH₄, consisting of one carbon atom bonded to four hydrogen atoms.',
                        difficulty: 'easy'
                    }
                ]
            }
        ]
    },
    English: {
        5: [
            {
                title: 'Grammar Fundamentals',
                chapter: 'Grammar',
                questions: [
                    {
                        question: 'Which of the following is a noun?',
                        options: [
                            { text: 'Run', isCorrect: false },
                            { text: 'Beautiful', isCorrect: false },
                            { text: 'Book', isCorrect: true },
                            { text: 'Quickly', isCorrect: false }
                        ],
                        explanation: 'A noun is a word that names a person, place, thing, or idea. "Book" is a thing.',
                        difficulty: 'easy'
                    },
                    {
                        question: 'What is the plural form of "child"?',
                        options: [
                            { text: 'Childs', isCorrect: false },
                            { text: 'Children', isCorrect: true },
                            { text: 'Childes', isCorrect: false },
                            { text: 'Childies', isCorrect: false }
                        ],
                        explanation: '"Children" is the irregular plural form of "child".',
                        difficulty: 'medium'
                    }
                ]
            }
        ],
        6: [
            {
                title: 'Reading Comprehension',
                chapter: 'Comprehension',
                questions: [
                    {
                        question: 'In the sentence "The cat sat on the mat," what is the subject?',
                        options: [
                            { text: 'sat', isCorrect: false },
                            { text: 'cat', isCorrect: true },
                            { text: 'mat', isCorrect: false },
                            { text: 'on', isCorrect: false }
                        ],
                        explanation: 'The subject is who or what the sentence is about. "The cat" is performing the action.',
                        difficulty: 'easy'
                    }
                ]
            }
        ],
        7: [
            {
                title: 'Poetry and Literature',
                chapter: 'Literature',
                questions: [
                    {
                        question: 'What is a metaphor?',
                        options: [
                            { text: 'A comparison using "like" or "as"', isCorrect: false },
                            { text: 'A direct comparison without using "like" or "as"', isCorrect: true },
                            { text: 'A question that doesn\'t need an answer', isCorrect: false },
                            { text: 'Words that sound the same', isCorrect: false }
                        ],
                        explanation: 'A metaphor is a figure of speech that makes a direct comparison between two unlike things without using "like" or "as".',
                        difficulty: 'medium'
                    }
                ]
            }
        ],
        8: [
            {
                title: 'Writing Skills and Essays',
                chapter: 'Writing',
                questions: [
                    {
                        question: 'What is the purpose of a topic sentence?',
                        options: [
                            { text: 'To end the paragraph', isCorrect: false },
                            { text: 'To introduce the main idea of the paragraph', isCorrect: true },
                            { text: 'To provide examples', isCorrect: false },
                            { text: 'To connect to the next paragraph', isCorrect: false }
                        ],
                        explanation: 'A topic sentence introduces the main idea or theme of a paragraph.',
                        difficulty: 'easy'
                    }
                ]
            }
        ],
        9: [
            {
                title: 'Advanced Grammar and Syntax',
                chapter: 'Grammar',
                questions: [
                    {
                        question: 'Identify the type of clause: "When the rain stopped"',
                        options: [
                            { text: 'Independent clause', isCorrect: false },
                            { text: 'Dependent clause', isCorrect: true },
                            { text: 'Noun clause', isCorrect: false },
                            { text: 'Complete sentence', isCorrect: false }
                        ],
                        explanation: 'This is a dependent clause because it begins with a subordinating conjunction "when" and cannot stand alone as a complete sentence.',
                        difficulty: 'hard'
                    }
                ]
            }
        ],
        10: [
            {
                title: 'Literature Analysis',
                chapter: 'Literature',
                questions: [
                    {
                        question: 'What literary device is used in "The wind whispered through the trees"?',
                        options: [
                            { text: 'Metaphor', isCorrect: false },
                            { text: 'Personification', isCorrect: true },
                            { text: 'Simile', isCorrect: false },
                            { text: 'Alliteration', isCorrect: false }
                        ],
                        explanation: 'Personification gives human characteristics to non-human things. Here, the wind is given the human ability to whisper.',
                        difficulty: 'medium'
                    }
                ]
            }
        ]
    }
};
async function seedTests() {
    try {
        console.log('🌱 Starting test seeding...');
        // Connect to database
        await (0, database_1.default)();
        console.log('✅ Connected to MongoDB');
        // Get admin user for creating tests
        const adminUser = await models_1.User.findOne({ role: 'admin' });
        if (!adminUser) {
            throw new Error('No admin user found. Please run the main seed script first.');
        }
        // Get all subjects
        const subjects = await models_1.Subject.find({ isActive: true });
        const subjectMap = new Map();
        subjects.forEach(subject => {
            subjectMap.set(subject.name, subject._id);
        });
        let testsCreated = 0;
        let questionsCreated = 0;
        // Create tests for each subject and class
        for (const [subjectName, classeData] of Object.entries(sampleTestsData)) {
            const subjectId = subjectMap.get(subjectName);
            if (!subjectId) {
                console.log(`⚠️ Subject ${subjectName} not found, skipping...`);
                continue;
            }
            console.log(`📚 Creating tests for ${subjectName}...`);
            for (const [classNumber, tests] of Object.entries(classeData)) {
                const classNum = parseInt(classNumber);
                for (const testData of tests) {
                    // Check if test already exists
                    const existingTest = await models_1.Test.findOne({
                        title: testData.title,
                        subject: subjectId,
                        classNumber: classNum
                    });
                    if (existingTest) {
                        console.log(`ℹ️ Test "${testData.title}" for Class ${classNum} ${subjectName} already exists`);
                        continue;
                    }
                    // Create test
                    const totalMarks = testData.questions.length * 2; // 2 marks per question
                    const newTest = new models_1.Test({
                        title: testData.title,
                        description: `A comprehensive test on ${testData.chapter} for Class ${classNum} students`,
                        subject: subjectId,
                        classNumber: classNum,
                        chapter: testData.chapter,
                        topic: testData.chapter, // Using chapter as topic for now
                        duration: Math.max(30, testData.questions.length * 2), // 2 minutes per question, minimum 30
                        totalQuestions: testData.questions.length,
                        totalMarks: totalMarks,
                        passingMarks: Math.ceil(totalMarks * 0.4), // 40% passing marks
                        instructions: [
                            'Read all questions carefully before answering',
                            'Each question carries equal marks',
                            'There is no negative marking',
                            'You can review and change your answers before submission',
                            'Click Submit only when you are sure about your answers'
                        ],
                        isActive: true,
                        isPublished: true,
                        allowedAttempts: 3,
                        showResults: true,
                        showCorrectAnswers: true,
                        randomizeQuestions: false,
                        randomizeOptions: false,
                        createdBy: adminUser._id
                    });
                    await newTest.save();
                    testsCreated++;
                    console.log(`✅ Created test: "${testData.title}" for Class ${classNum} ${subjectName}`);
                    // Create questions for this test
                    for (let i = 0; i < testData.questions.length; i++) {
                        const questionData = testData.questions[i];
                        const newQuestion = new models_1.QuestionEnhancedV2({
                            test: newTest._id,
                            question: questionData.question,
                            questionType: questionData.questionType || 'single-choice',
                            options: questionData.options.map((option, index) => ({
                                ...option,
                                order: index + 1
                            })),
                            explanation: questionData.explanation,
                            marks: 2,
                            order: i + 1,
                            subject: subjectId,
                            classNumber: classNum,
                            chapter: testData.chapter,
                            topic: testData.chapter, // Using chapter as topic for now
                            difficulty: questionData.difficulty || 'medium',
                            tags: [testData.chapter, subjectName, `Class ${classNum}`],
                            isActive: true,
                            estimatedTime: 60,
                            hasImage: false,
                            hasExplanation: !!questionData.explanation,
                            hasHint: false,
                            usageCount: 0,
                            correctAnswerRate: 0,
                            avgTimeSpent: 0,
                            isVerified: false,
                            autoTestEligible: true,
                            testTypes: ['practice', 'exam', 'quiz'],
                            createdBy: adminUser._id
                        });
                        await newQuestion.save();
                        questionsCreated++;
                    }
                }
            }
        }
        // Create some mixed difficulty tests
        await createMixedTests(subjectMap, adminUser._id);
        console.log('🎉 Test seeding completed successfully!');
        console.log(`📊 Created ${testsCreated} tests with ${questionsCreated} questions`);
        console.log('\n📋 Sample Tests Created:');
        console.log('🧮 Mathematics: Basic Arithmetic, Geometry, Algebra, Trigonometry');
        console.log('🔬 Science: Environment, Chemistry, Physics, Biology');
        console.log('📖 English: Grammar, Comprehension, Literature, Writing');
        console.log('\n✨ Tests are available for Classes 5-10 across all subjects');
        console.log('🎯 Each test includes detailed explanations and proper difficulty levels');
    }
    catch (error) {
        console.error('❌ Error seeding tests:', error);
        throw error;
    }
}
async function createMixedTests(subjectMap, adminUserId) {
    console.log('🎯 Creating mixed difficulty tests...');
    const mixedTests = [
        {
            subject: 'Mathematics',
            class: 8,
            title: 'Mid-term Examination - Mathematics',
            chapter: 'Mixed Topics',
            questions: [
                {
                    question: 'Solve: (2x + 3)(x - 1) = 0',
                    options: [
                        { text: 'x = -3/2, x = 1', isCorrect: true },
                        { text: 'x = 3/2, x = -1', isCorrect: false },
                        { text: 'x = 2, x = 3', isCorrect: false },
                        { text: 'x = -2, x = -3', isCorrect: false }
                    ],
                    explanation: 'For a product to be zero, one factor must be zero. So 2x + 3 = 0 gives x = -3/2, and x - 1 = 0 gives x = 1.',
                    difficulty: 'hard'
                },
                {
                    question: 'What is the area of a trapezium with parallel sides 8 cm and 12 cm, and height 5 cm?',
                    options: [
                        { text: '40 sq cm', isCorrect: false },
                        { text: '50 sq cm', isCorrect: true },
                        { text: '60 sq cm', isCorrect: false },
                        { text: '100 sq cm', isCorrect: false }
                    ],
                    explanation: 'Area of trapezium = ½ × (sum of parallel sides) × height = ½ × (8 + 12) × 5 = ½ × 20 × 5 = 50 sq cm.',
                    difficulty: 'medium'
                },
                {
                    question: 'Which of the following numbers are prime?',
                    options: [
                        { text: '17, 19', isCorrect: true },
                        { text: '15, 21', isCorrect: false },
                        { text: '9, 25', isCorrect: false },
                        { text: '4, 6', isCorrect: false }
                    ],
                    explanation: 'Prime numbers have only two factors: 1 and themselves. 17 and 19 are prime numbers.',
                    difficulty: 'easy',
                    questionType: 'multiple-choice'
                }
            ]
        }
    ];
    for (const testData of mixedTests) {
        const subjectId = subjectMap.get(testData.subject);
        if (!subjectId)
            continue;
        const existingTest = await models_1.Test.findOne({
            title: testData.title,
            subject: subjectId,
            classNumber: testData.class
        });
        if (existingTest) {
            console.log(`ℹ️ Mixed test "${testData.title}" already exists`);
            continue;
        }
        const totalMarks = testData.questions.length * 3; // 3 marks per question for mixed tests
        const newTest = new models_1.Test({
            title: testData.title,
            description: `A comprehensive examination covering multiple topics for Class ${testData.class} students`,
            subject: subjectId,
            classNumber: testData.class,
            chapter: testData.chapter,
            duration: 60, // 1 hour for mixed tests
            totalQuestions: testData.questions.length,
            totalMarks: totalMarks,
            passingMarks: Math.ceil(totalMarks * 0.5), // 50% passing marks for mixed tests
            instructions: [
                'This is a comprehensive examination covering multiple topics',
                'Read all questions carefully before answering',
                'Manage your time effectively',
                'Show all working where applicable',
                'There is no negative marking'
            ],
            isActive: true,
            isPublished: true,
            allowedAttempts: 2,
            showResults: true,
            showCorrectAnswers: true,
            randomizeQuestions: true,
            randomizeOptions: true,
            createdBy: adminUserId
        });
        await newTest.save();
        console.log(`✅ Created mixed test: "${testData.title}"`);
        // Create questions
        for (let i = 0; i < testData.questions.length; i++) {
            const questionData = testData.questions[i];
            const newQuestion = new models_1.QuestionEnhancedV2({
                test: newTest._id,
                question: questionData.question,
                questionType: questionData.questionType || 'single-choice',
                options: questionData.options.map((option, index) => ({
                    ...option,
                    order: index + 1
                })),
                explanation: questionData.explanation,
                marks: 3,
                order: i + 1,
                subject: subjectId,
                classNumber: testData.class,
                chapter: testData.chapter,
                topic: testData.chapter, // Using chapter as topic for mixed tests
                difficulty: questionData.difficulty || 'medium',
                tags: ['Mixed Topics', testData.subject, `Class ${testData.class}`, 'Examination'],
                isActive: true,
                estimatedTime: 90, // 90 seconds for mixed test questions
                hasImage: false,
                hasExplanation: !!questionData.explanation,
                hasHint: false,
                usageCount: 0,
                correctAnswerRate: 0,
                avgTimeSpent: 0,
                isVerified: false,
                autoTestEligible: true,
                testTypes: ['practice', 'exam', 'quiz'],
                createdBy: adminUserId
            });
            await newQuestion.save();
        }
    }
}
// Run the seed function if this file is executed directly
if (require.main === module) {
    seedTests()
        .then(() => {
        process.exit(0);
    })
        .catch((error) => {
        console.error('Failed to seed tests:', error);
        process.exit(1);
    });
}
exports.default = seedTests;
