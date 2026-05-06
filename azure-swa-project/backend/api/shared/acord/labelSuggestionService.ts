import { ACORD_LABELS, AcordLabelSuggestion } from "./acordModels";
import { EmbeddingsService } from "./embeddingsService";
import { RuleBasedProcessor } from "./ruleBasedProcessor";
import { MultiFieldSplitter } from "./multiFieldSplitter";

export interface SuggestionField {
  fieldName: string;
  fieldValue: string;
}

export class LabelSuggestionService {
  private embeddingsService: EmbeddingsService;
  private ruleProcessor: RuleBasedProcessor;
  private fieldSplitter: MultiFieldSplitter;

  constructor(embeddingsService: EmbeddingsService) {
    this.embeddingsService = embeddingsService;
    this.ruleProcessor = new RuleBasedProcessor();
    this.fieldSplitter = new MultiFieldSplitter();
  }

  async suggestLabels(fields: SuggestionField[]): Promise<AcordLabelSuggestion[]> {
    const suggestions: AcordLabelSuggestion[] = [];
    for (const field of fields) {
      const ruleLabels = this.ruleProcessor.processField(field.fieldName, field.fieldValue);
      suggestions.push(...ruleLabels.map((label) => (  {
        labelId: label.id,
        labelName: label.name,
        confidence: 0.8,
        reason: "Matched field " + field.fieldName,
        source: "rule-based" as const,
      } )));
    }
    return this.rankSuggestions(suggestions);
  }

  private rankSuggestions(suggestions: AcordLabelSuggestion[]): AcordLabelSuggestion[] {
    const map = new Map<string, AcordLabelSuggestion>();
    for (const suggestion of suggestions) {
      if (!map.has(suggestion.labelId) || suggestion.confidence > map.get(suggestion.labelId)!.confidence) {
        map.set(suggestion.labelId, suggestion);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  async getSuggestionsWithAnalysis(fields: SuggestionField[]) {
    const startTime = Date.now();
    const suggestions = await this.suggestLabels(fields);
    const processingTimeMs = Date.now() - startTime;
    const avgConfidence = suggestions.length > 0 ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length : 0;
    return {
      suggestions,
      analysis: {
        fieldCount: fields.length,
        suggestionsGenerated: suggestions.length,
        averageConfidence: avgConfidence,
        processingTimeMs,
      },
    };
  }
}
