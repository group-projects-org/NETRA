const blueprint = require("./blueprint");
const mockQuestions = [];
let questionId = 1;
for (let examiner = 1; examiner <= 5; examiner++) {
    for (const [topic, difficulties] of Object.entries(blueprint.distribution)) {
        for (const [difficulty, count] of Object.entries(difficulties)) {
            for (let i = 1; i <= count; i++) {
                mockQuestions.push({
                    id: `Q${String(questionId).padStart(3, "0")}`,
                    question: `Sample ${difficulty} question ${i} from ${topic}`,
                    topic: topic,
                    difficulty: difficulty,
                    examinerId: `EXM${String(examiner).padStart(3, "0")}`,
                    status: "APPROVED"
                });
                questionId++;
            }
        }
    }
}
module.exports = mockQuestions;
