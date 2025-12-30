export type DiffType = 'same' | 'added' | 'removed';

export interface DiffPart {
    type: DiffType;
    value: string;
}

export function computeDiff(text1: string, text2: string): DiffPart[] {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);

    // A very naive diff implementation for simplicity (O(N*M) worst case but usually fine for short texts)
    // For production, use something like 'diff-match-patch' or 'fast-diff'
    // Here we just look for simple equality for demonstration

    const diff: DiffPart[] = [];
    let i = 0;
    let j = 0;

    while (i < words1.length || j < words2.length) {
        if (i < words1.length && j < words2.length && words1[i] === words2[j]) {
            diff.push({ type: 'same', value: words1[i] });
            i++;
            j++;
        } else {
            // Check ahead to see if we can re-sync
            let syncFound = false;

            // Look ahead in words2 for match with words1[i]
            for (let k = 1; k < 5; k++) {
                if (j + k < words2.length && words1[i] === words2[j + k]) {
                    // Found match ahead, assume intervening words were added
                    for (let m = 0; m < k; m++) {
                        diff.push({ type: 'added', value: words2[j + m] });
                    }
                    j += k;
                    syncFound = true;
                    break;
                }
            }

            if (!syncFound) {
                // Look ahead in words1 for match with words2[j]
                for (let k = 1; k < 5; k++) {
                    if (i + k < words1.length && words1[i + k] === words2[j]) {
                        // Found match ahead, assume intervening words were removed
                        for (let m = 0; m < k; m++) {
                            diff.push({ type: 'removed', value: words1[i + m] });
                        }
                        i += k;
                        syncFound = true;
                        break;
                    }
                }
            }

            if (!syncFound) {
                // Nothing matches nearby, treat as substitution (remove old, add new)
                if (i < words1.length) {
                    diff.push({ type: 'removed', value: words1[i] });
                    i++;
                }
                if (j < words2.length) {
                    diff.push({ type: 'added', value: words2[j] });
                    j++;
                }
            }
        }
    }

    return diff;
}
