const crypto = require("crypto");
const blueprint = require("./data/blueprint");
const mockQuestions = require("./data/mockQuestion");
// Secure random number between 0 and max - 1
function secureRandomInt(max) {
    if (max <= 0) {
        throw new Error("Invalid random range");
    }
    return crypto.randomInt(max);
}

// Randomly shuffle an array using Fisher-Yates algorithm
function secureShuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
// Validate the input dataset
function validateDataset() {
    const approvedQuestions = mockQuestions.filter(
        question => question.status === "APPROVED"
    );
    const questionIds = new Set(mockQuestions.map(question => question.id));
    if (questionIds.size !== mockQuestions.length) {
        throw new Error("Duplicate question IDs found");
    }
    if (approvedQuestions.length !== mockQuestions.length) {
        throw new Error("Some questions are not approved");
    }

    const examinerIds = [...new Set(mockQuestions.map(q => q.examinerId))];

    if (examinerIds.length !== 5) {
        throw new Error("Expected exactly 5 examiners");
    }

    for (const examinerId of examinerIds) {
        const examinerQuestions = mockQuestions.filter(
            question => question.examinerId === examinerId
        );

        if (examinerQuestions.length !== blueprint.totalQuestions) {
            throw new Error(`${examinerId} does not have exactly 50 questions`);
        }
        for (const [topic, difficulties] of Object.entries(blueprint.distribution)) {
            for (const [difficulty, expectedCount] of Object.entries(difficulties)) {
                const actualCount = examinerQuestions.filter(
                    question =>
                        question.topic === topic &&
                        question.difficulty === difficulty
                ).length;
                if (actualCount !== expectedCount) {
                    throw new Error(
                        `${examinerId}: Invalid ${topic} - ${difficulty} distribution`
                    );
                }
            }
        }
    }
    return approvedQuestions;
}
// Main stochastic selection algorithm
function generateQuestionPaper() {
    console.log("\n===== STOCHASTIC SELECTION STARTED =====");
    const approvedQuestions = validateDataset();
    const selectedQuestions = [];
    // Create topic + difficulty buckets
    for (const [topic, difficulties] of Object.entries(blueprint.distribution)) {
        for (const [difficulty, requiredCount] of Object.entries(difficulties)) {
            const bucket = approvedQuestions.filter(
                question =>question.topic === topic && question.difficulty === difficulty
            );
            console.log(
                `\n${topic} - ${difficulty}: Available ${bucket.length}, Required ${requiredCount}`
            );
            // Check bucket availability
            if (bucket.length < requiredCount) {
                throw new Error(
                    `Insufficient questions in ${topic} - ${difficulty}. Required: ${requiredCount}, Available: ${bucket.length}`
                );
            }
            // Randomly select questions without replacement
            const shuffledBucket = secureShuffle(bucket);
            const selectedFromBucket = shuffledBucket.slice(0, requiredCount);
            selectedQuestions.push(...selectedFromBucket);
        }
    }
    // Shuffle final paper order
    const finalPaper = secureShuffle(selectedQuestions);
    // Final validation
    if (finalPaper.length !== blueprint.totalQuestions) {
        throw new Error("Final paper question count does not match blueprint");
    }
    const uniqueIds = new Set(finalPaper.map(question => question.id));
    if (uniqueIds.size !== finalPaper.length) {
        throw new Error("Duplicate questions found in final paper");
    }
    console.log("\n===== QUESTION PAPER GENERATED =====");
    console.log("Total Selected:", finalPaper.length);
    console.log("Unique Questions:", uniqueIds.size);
    return finalPaper;
}
// Execute algorithm only when run directly
if (require.main === module) {
    try {
        const questionPaper = generateQuestionPaper();
        console.log("\n===== SELECTED QUESTIONS =====\n");
        questionPaper.forEach((question, index) => {
            console.log(
                `${index + 1}. ${question.id} | ${question.topic} | ${question.difficulty} | ${question.examinerId}`
            );
        });
        console.log("\nQuestion paper generated successfully!");
    } catch (error) {
        console.error("\nSELECTION FAILED:", error.message);
    }
}

module.exports = { secureRandomInt, secureShuffle, validateDataset, generateQuestionPaper };
