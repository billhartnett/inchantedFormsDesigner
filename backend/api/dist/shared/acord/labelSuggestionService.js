"use strict";
/**
 * ACORD Label Suggestion Service
 * Orchestrates embeddings, search, and rule-based processing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelSuggestionService = void 0;
const ruleBasedProcessor_1 = require("./ruleBasedProcessor");
const multiFieldSplitter_1 = require("./multiFieldSplitter");
class LabelSuggestionService {
    constructor(embeddingsService) {
        this.embeddingsService = embeddingsService;
    }
    /**
     * Main entry point: suggest ACORD labels for form fields
     */
    async suggestLabels(request) {
        const startTime = Date.now();
        const modelsUsed = new Set(["embeddings", "vector-search", "rules"]);
        try {
            const suggestions = [];
            // Process each field
            for (let idx = 0; idx < request.fields.length; idx++) {
                const field = request.fields[idx];
                const result = await this.suggestLabelsForField(field, request.topK || 3, idx, request.fields.length);
                suggestions.push(result);
            }
            const processingTimeMs = Date.now() - startTime;
            return {
                success: true,
                documentType: request.documentType,
                suggestions,
                metadata: {
                    processedAt: new Date().toISOString(),
                    processingTimeMs,
                    fieldsProcessed: request.fields.length,
                    modelsUsed: Array.from(modelsUsed),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                suggestions: [],
                metadata: {
                    processedAt: new Date().toISOString(),
                    processingTimeMs: Date.now() - startTime,
                    fieldsProcessed: 0,
                    modelsUsed: Array.from(modelsUsed),
                },
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Suggest labels for a single field
     */
    async suggestLabelsForField(field, topK, fieldIndex, totalFields) {
        const reasoning = [];
        try {
            // Step 1: Split field into components
            const splitField = multiFieldSplitter_1.MultiFieldSplitter.splitField(field.content, field.fieldType);
            reasoning.push(`Detected patterns: ${splitField.detectedPatterns.join(", ") || "text"}`);
            // Step 2: Get vector search scores using embeddings
            reasoning.push("Performing semantic search...");
            const vectorScores = await this.embeddingsService.rankLabels(field.fieldName, field.content, topK * 3 // Get more candidates for filtering
            );
            reasoning.push(`Vector search returned ${vectorScores.size} candidates`);
            // Step 3: Apply rule-based processing
            reasoning.push("Applying rule-based post-processing...");
            const ruleResult = ruleBasedProcessor_1.RuleBasedProcessor.processRules(field.fieldName, field.content, vectorScores, fieldIndex, totalFields);
            reasoning.push(...ruleResult.reasoning);
            reasoning.push(`Applied rules: ${ruleResult.appliedRules.join(", ")}`);
            // Step 4: Filter by field type if provided
            let finalScores = ruleResult.adjustedScores;
            if (field.fieldType) {
                reasoning.push(`Filtering by field type: ${field.fieldType}`);
                finalScores = ruleBasedProcessor_1.RuleBasedProcessor.filterByFieldType(finalScores, field.fieldType);
            }
            // Step 5: Create suggestion objects and rank
            const suggestions = this.createSuggestions(finalScores, vectorScores, ruleResult.boostedLabels);
            // Sort by score and return top K
            const topSuggestions = suggestions
                .sort((a, b) => b.score - a.score)
                .slice(0, topK);
            // Calculate overall confidence
            const avgConfidence = topSuggestions.length > 0
                ? topSuggestions.reduce((sum, s) => sum + s.score, 0) / topSuggestions.length
                : 0;
            return {
                fieldName: field.fieldName,
                suggestedLabels: topSuggestions,
                confidence: Math.min(1, avgConfidence),
                reasoning,
            };
        }
        catch (error) {
            reasoning.push(`Error processing field: ${error instanceof Error ? error.message : String(error)}`);
            return {
                fieldName: field.fieldName,
                suggestedLabels: [],
                confidence: 0,
                reasoning,
            };
        }
    }
    /**
     * Create LabelSuggestion objects with scoring breakdown
     */
    createSuggestions(finalScores, vectorScores, boostedLabels) {
        const suggestions = [];
        finalScores.forEach((ruleScore, labelId) => {
            const label = this.embeddingsService.getLabelById(labelId);
            if (!label)
                return;
            const vectorScore = vectorScores.get(labelId) || 0;
            const isVectorBased = vectorScore > 0;
            const isRuleBased = ruleScore > 0;
            const isBoosted = boostedLabels.includes(labelId);
            // Determine method
            let method = "vector";
            if (isVectorBased && isRuleBased) {
                method = "hybrid";
            }
            else if (isBoosted) {
                method = "pattern";
            }
            else if (isRuleBased) {
                method = "rule-based";
            }
            // Final score is combination of vector and rule-based scores
            const finalScore = Math.min(1, (vectorScore + ruleScore) / 2);
            const explanation = this.createExplanation(label, vectorScore, ruleScore, method);
            suggestions.push({
                label,
                score: finalScore,
                method,
                explanation,
            });
        });
        return suggestions;
    }
    /**
     * Create human-readable explanation for suggestion
     */
    createExplanation(label, vectorScore, ruleScore, method) {
        const parts = [];
        if (vectorScore > 0) {
            parts.push(`semantic match (${(vectorScore * 100).toFixed(0)}%)`);
        }
        if (ruleScore > 0) {
            parts.push(`rule-based match (${(ruleScore * 100).toFixed(0)}%)`);
        }
        if (parts.length === 0) {
            return `Pattern match for ${label.name}`;
        }
        return `Suggested as ${label.name} based on ${parts.join(" and ")}`;
    }
    /**
     * Get label suggestions with detailed analysis
     */
    async getSuggestionsWithAnalysis(request) {
        const response = await this.suggestLabels(request);
        // Generate detailed analysis
        const analysis = this.generateAnalysis(response.suggestions, request.documentType);
        return {
            ...response,
            analysis,
        };
    }
    /**
     * Generate detailed analysis of suggestions
     */
    generateAnalysis(suggestions, documentType) {
        const lines = [];
        lines.push("=== ACORD Label Suggestion Analysis ===\n");
        if (documentType) {
            lines.push(`Document Type: ${documentType}\n`);
        }
        suggestions.forEach((result, idx) => {
            lines.push(`\nField ${idx + 1}: ${result.fieldName}`);
            lines.push(`Overall Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            if (result.suggestedLabels.length > 0) {
                lines.push("Suggested Labels:");
                result.suggestedLabels.forEach((suggestion, idx) => {
                    lines.push(`  ${idx + 1}. ${suggestion.label.name} (${suggestion.method}) - ${(suggestion.score * 100).toFixed(1)}%`);
                    lines.push(`     ${suggestion.explanation}`);
                });
            }
            else {
                lines.push("No suggestions found");
            }
            if (result.reasoning.length > 0) {
                lines.push("Reasoning:");
                result.reasoning.forEach(r => {
                    lines.push(`  • ${r}`);
                });
            }
        });
        return lines.join("\n");
    }
}
exports.LabelSuggestionService = LabelSuggestionService;
