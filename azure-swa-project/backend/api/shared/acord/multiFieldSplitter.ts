export class MultiFieldSplitter {
  private readonly SEPARATORS = [";", ",", "|", "/", "&"];

  split(fieldName: string): string[] {
    for (const sep of this.SEPARATORS) {
      if (fieldName.includes(sep)) {
        return fieldName.split(sep).map((s) => s.trim()).filter((s) => s.length > 0);
      }
    }
    return [fieldName];
  }

  splitAddress(address: string) {
    const parts = address.split(",").map((p) => p.trim());
    return { street: parts[0], city: parts[1], state: parts[2], zip: parts[3] };
  }
}
