const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
    secureRandomInt,
    secureShuffle,
    validateDataset,
    generateQuestionPaper,
} = require("../../stochastic-selection/index");
const blueprint = require("../../stochastic-selection/data/blueprint");
const mockQuestions = require("../../stochastic-selection/data/mockQuestion");

// ============================================================
// secureRandomInt
// ============================================================
describe("secureRandomInt", () => {
    test("returns an integer in range [0, max)", () => {
        const max = 10;
        for (let i = 0; i < 100; i++) {
            const result = secureRandomInt(max);
            assert.ok(Number.isInteger(result), `Expected integer, got ${result}`);
            assert.ok(result >= 0, `Expected >= 0, got ${result}`);
            assert.ok(result < max, `Expected < ${max}, got ${result}`);
        }
    });

    test("returns 0 when max is 1", () => {
        for (let i = 0; i < 20; i++) {
            assert.equal(secureRandomInt(1), 0);
        }
    });

    test("throws Error for max = 0", () => {
        assert.throws(() => secureRandomInt(0), {
            message: "Invalid random range",
        });
    });

    test("throws Error for negative max", () => {
        assert.throws(() => secureRandomInt(-5), {
            message: "Invalid random range",
        });
    });

    test("throws Error for max = -1", () => {
        assert.throws(() => secureRandomInt(-1), {
            message: "Invalid random range",
        });
    });
});

// ============================================================
// secureShuffle
// ============================================================
describe("secureShuffle", () => {
    test("returns array of same length", () => {
        const input = [1, 2, 3, 4, 5];
        const result = secureShuffle(input);
        assert.equal(result.length, input.length);
    });

    test("contains the same elements (no loss/gain)", () => {
        const input = [10, 20, 30, 40, 50];
        const result = secureShuffle(input);
        assert.deepStrictEqual(result.sort((a, b) => a - b), [...input].sort((a, b) => a - b));
    });

    test("does not modify the original array", () => {
        const input = [1, 2, 3, 4, 5];
        const copy = [...input];
        secureShuffle(input);
        assert.deepStrictEqual(input, copy);
    });

    test("empty array returns empty array", () => {
        const result = secureShuffle([]);
        assert.deepStrictEqual(result, []);
    });

    test("single element array returns single element array", () => {
        const result = secureShuffle([42]);
        assert.deepStrictEqual(result, [42]);
    });

    test("works with arrays of objects", () => {
        const input = [{ a: 1 }, { b: 2 }, { c: 3 }];
        const result = secureShuffle(input);
        assert.equal(result.length, input.length);
        for (const item of input) {
            assert.ok(result.includes(item), `Missing object in shuffled array`);
        }
    });

    test("produces different orderings across runs (stochastic)", () => {
        const input = Array.from({ length: 20 }, (_, i) => i);
        const results = new Set();
        for (let i = 0; i < 10; i++) {
            results.add(JSON.stringify(secureShuffle(input)));
        }
        // With 20 elements, it is astronomically unlikely all 10 runs produce the same order
        assert.ok(results.size > 1, "Expected at least two distinct orderings in 10 shuffles");
    });
});

// ============================================================
// validateDataset
// ============================================================
describe("validateDataset", () => {
    test("returns an array of approved questions when dataset is valid", () => {
        const result = validateDataset();
        assert.ok(Array.isArray(result), "Expected result to be an array");
        assert.ok(result.length > 0, "Expected non-empty array of approved questions");
    });

    test("all returned questions have status APPROVED", () => {
        const result = validateDataset();
        for (const q of result) {
            assert.equal(q.status, "APPROVED");
        }
    });

    test("returned length equals mockQuestions length (all approved)", () => {
        const result = validateDataset();
        assert.equal(result.length, mockQuestions.length);
    });

    test("validates against blueprint distribution (no errors thrown)", () => {
        // If the dataset were invalid, validateDataset would throw.
        // A clean return means blueprint distribution is satisfied per examiner.
        assert.doesNotThrow(() => validateDataset());
    });
});

// ============================================================
// generateQuestionPaper
// ============================================================
describe("generateQuestionPaper", () => {
    test("returns exactly blueprint.totalQuestions questions (50)", () => {
        const paper = generateQuestionPaper();
        assert.equal(paper.length, blueprint.totalQuestions);
    });

    test("all questions have unique IDs", () => {
        const paper = generateQuestionPaper();
        const ids = paper.map((q) => q.id);
        const uniqueIds = new Set(ids);
        assert.equal(uniqueIds.size, paper.length, "Duplicate IDs found in question paper");
    });

    test("questions match blueprint distribution (correct count per topic + difficulty)", () => {
        const paper = generateQuestionPaper();
        for (const [topic, difficulties] of Object.entries(blueprint.distribution)) {
            for (const [difficulty, expectedCount] of Object.entries(difficulties)) {
                const actualCount = paper.filter(
                    (q) => q.topic === topic && q.difficulty === difficulty
                ).length;
                assert.equal(
                    actualCount,
                    expectedCount,
                    `${topic} - ${difficulty}: expected ${expectedCount}, got ${actualCount}`
                );
            }
        }
    });

    test("every selected question has status APPROVED", () => {
        const paper = generateQuestionPaper();
        for (const q of paper) {
            assert.equal(q.status, "APPROVED");
        }
    });

    test("every selected question has required properties", () => {
        const paper = generateQuestionPaper();
        for (const q of paper) {
            assert.ok(q.id, "Question missing id");
            assert.ok(q.topic, "Question missing topic");
            assert.ok(q.difficulty, "Question missing difficulty");
            assert.ok(q.examinerId, "Question missing examinerId");
            assert.ok(q.status, "Question missing status");
        }
    });

    test("running twice produces different orderings (stochastic)", () => {
        const paper1 = generateQuestionPaper();
        const paper2 = generateQuestionPaper();
        const ids1 = paper1.map((q) => q.id);
        const ids2 = paper2.map((q) => q.id);
        // Same set of possible questions, but ordering should differ
        // (astronomically unlikely to be identical for 50 shuffled items)
        const sameOrder = JSON.stringify(ids1) === JSON.stringify(ids2);
        assert.ok(!sameOrder, "Two consecutive papers should have different orderings");
    });

    test("all question topics are from the blueprint", () => {
        const paper = generateQuestionPaper();
        const validTopics = Object.keys(blueprint.distribution);
        for (const q of paper) {
            assert.ok(validTopics.includes(q.topic), `Unexpected topic: ${q.topic}`);
        }
    });

    test("all question difficulties are from the blueprint", () => {
        const paper = generateQuestionPaper();
        const validDifficulties = new Set(["Easy", "Medium", "Hard"]);
        for (const q of paper) {
            assert.ok(validDifficulties.has(q.difficulty), `Unexpected difficulty: ${q.difficulty}`);
        }
    });
});

// ============================================================
// blueprint.js
// ============================================================
describe("blueprint", () => {
    test("has totalQuestions equal to 50", () => {
        assert.equal(blueprint.totalQuestions, 50);
    });

    test("distribution sums to totalQuestions (50)", () => {
        let sum = 0;
        for (const difficulties of Object.values(blueprint.distribution)) {
            for (const count of Object.values(difficulties)) {
                sum += count;
            }
        }
        assert.equal(sum, blueprint.totalQuestions);
    });

    test("has all expected topics", () => {
        const expectedTopics = ["Mechanics", "Thermodynamics", "Optics", "Electricity", "Modern Physics"];
        const actualTopics = Object.keys(blueprint.distribution);
        assert.deepStrictEqual(actualTopics.sort(), expectedTopics.sort());
    });

    test("every topic has Easy, Medium, and Hard difficulties", () => {
        const expectedDifficulties = ["Easy", "Medium", "Hard"];
        for (const [topic, difficulties] of Object.entries(blueprint.distribution)) {
            const actualDifficulties = Object.keys(difficulties);
            assert.deepStrictEqual(
                actualDifficulties.sort(),
                expectedDifficulties.sort(),
                `Topic "${topic}" missing difficulty levels`
            );
        }
    });

    test("all count values are positive integers", () => {
        for (const [topic, difficulties] of Object.entries(blueprint.distribution)) {
            for (const [difficulty, count] of Object.entries(difficulties)) {
                assert.ok(Number.isInteger(count), `${topic}/${difficulty} count is not integer`);
                assert.ok(count > 0, `${topic}/${difficulty} count is not positive`);
            }
        }
    });
});

// ============================================================
// mockQuestion.js
// ============================================================
describe("mockQuestion data", () => {
    test("generates exactly 250 questions (5 examiners × 50)", () => {
        assert.equal(mockQuestions.length, 250);
    });

    test("all questions have status APPROVED", () => {
        for (const q of mockQuestions) {
            assert.equal(q.status, "APPROVED");
        }
    });

    test("has exactly 5 unique examiners", () => {
        const examiners = new Set(mockQuestions.map((q) => q.examinerId));
        assert.equal(examiners.size, 5);
    });

    test("each examiner has exactly 50 questions", () => {
        const examinerCounts = {};
        for (const q of mockQuestions) {
            examinerCounts[q.examinerId] = (examinerCounts[q.examinerId] || 0) + 1;
        }
        for (const [examinerId, count] of Object.entries(examinerCounts)) {
            assert.equal(count, 50, `${examinerId} has ${count} questions, expected 50`);
        }
    });

    test("no duplicate question IDs", () => {
        const ids = mockQuestions.map((q) => q.id);
        const uniqueIds = new Set(ids);
        assert.equal(uniqueIds.size, ids.length, "Duplicate question IDs found");
    });

    test("distribution matches blueprint per examiner", () => {
        const examiners = [...new Set(mockQuestions.map((q) => q.examinerId))];
        for (const examinerId of examiners) {
            const examinerQuestions = mockQuestions.filter((q) => q.examinerId === examinerId);
            for (const [topic, difficulties] of Object.entries(blueprint.distribution)) {
                for (const [difficulty, expectedCount] of Object.entries(difficulties)) {
                    const actualCount = examinerQuestions.filter(
                        (q) => q.topic === topic && q.difficulty === difficulty
                    ).length;
                    assert.equal(
                        actualCount,
                        expectedCount,
                        `${examinerId}: ${topic}/${difficulty} - expected ${expectedCount}, got ${actualCount}`
                    );
                }
            }
        }
    });

    test("all questions have required properties", () => {
        for (const q of mockQuestions) {
            assert.ok(q.id, "Question missing id");
            assert.ok(q.question, "Question missing question text");
            assert.ok(q.topic, "Question missing topic");
            assert.ok(q.difficulty, "Question missing difficulty");
            assert.ok(q.examinerId, "Question missing examinerId");
            assert.ok(q.status, "Question missing status");
        }
    });

    test("all question IDs match expected format Q###", () => {
        const idPattern = /^Q\d{3}$/;
        for (const q of mockQuestions) {
            assert.match(q.id, idPattern, `ID "${q.id}" doesn't match Q### format`);
        }
    });

    test("all examiner IDs match expected format EXM###", () => {
        const idPattern = /^EXM\d{3}$/;
        for (const q of mockQuestions) {
            assert.match(q.examinerId, idPattern, `Examiner ID "${q.examinerId}" doesn't match EXM### format`);
        }
    });
});
