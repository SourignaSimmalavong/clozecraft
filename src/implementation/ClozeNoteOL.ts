import { ClozeDeletionOL } from "./ClozeDeletionOL";
import { ClozeNote } from "./ClozeNote";
import { IClozePattern } from "../interfaces/IClozePattern";
import { IClozeRegExpExecArray } from "../interfaces/IClozeRegExpExecArray";
import { simpleFormat } from "./utils";
import { ClozeTypeEnum } from "./ClozeTypeEnum";
import { IClozeFormat } from "../interfaces/IClozeFormat";


export class ClozeNoteOL extends ClozeNote<ClozeDeletionOL> {

    constructor(raw: string, patterns: IClozePattern[]) {
        super(raw, patterns);
    }

    get clozeType(): ClozeTypeEnum {
        return ClozeTypeEnum.OVERLAPPING;
    }

    protected initParsing(rawNote: string, patterns: IClozePattern[]): { clozeDeletions: ClozeDeletionOL[], numCards: number } {

        let clozeDeletions: ClozeDeletionOL[] = [];
        let numCards = 0;

        patterns.forEach((pattern) => {
            const regex = pattern.getClozeRegex(ClozeTypeEnum.OVERLAPPING)

            let match: IClozeRegExpExecArray | null;

            while (match = regex.exec(rawNote)) {
                if (!match.seq) {
                    break;
                }

                let newCloze: ClozeDeletionOL = {
                    raw: match.raw,
                    answer: match.answer,
                    seq: match.seq,
                    hint: match.hint
                };

                clozeDeletions.push(newCloze);

                // Get the max seq length
                if (numCards < newCloze.seq.length) {
                    numCards = newCloze.seq.length;
                }
            }
        });

        return { clozeDeletions, numCards };
    }

    getCardFront(cardIndex: number, format?: IClozeFormat): string {
        if (cardIndex >= this._numCards || cardIndex < 0) {
            throw new Error(`Card ${cardIndex} does not exist`);
        }

        if (!format) {
            format = new simpleFormat();
        }

        let frontText = this.raw;
        for (const deletion of this._clozeDeletions) {

            // If the cloze has a sequence that does not specify the action on a certain card 
            // (a shorter sequence length than on other clozes), the default action will be just show
            // Example:             "This is a ==cloze1==^[a] ==cloze2==^[sha] ==cloze3==^[ha]"
            // Will be the same as: "This is a ==cloze1==^[ass] ==cloze2==^[sha] ==cloze3==^[has]"
            let clozeAction = "s";
            if (cardIndex < deletion.seq.length) {
                clozeAction = deletion.seq[cardIndex];
            }

            switch (clozeAction) {
                case "a":
                    frontText = frontText.replace(deletion.raw, format.asking(deletion.answer, deletion.hint)); // Hide asked cloze
                    break;
                case "h":
                    frontText = frontText.replace(deletion.raw, format.hiding(deletion.answer, deletion.hint)); // Just hide
                    break;
                case "s":
                    frontText = frontText.replace(deletion.raw, deletion.answer); // Just show
                    break;
            }
        }
        return frontText;
    }

    getCardBack(cardIndex: number, format?: IClozeFormat): string {
        if (cardIndex >= this._numCards || cardIndex < 0) {
            throw new Error(`Card ${cardIndex} does not exist`);
        }

        if (!format) {
            format = new simpleFormat();
        }

        let backText = this.raw;
        for (const deletion of this._clozeDeletions) {

            // If the cloze has a sequence that does not specify the action on a certain card 
            // (a shorter sequence length than on other clozes), the default action will be just show
            // Example:             "This is a ==cloze1==^[a] ==cloze2==^[sha] ==cloze3==^[ha]"
            // Will be the same as: "This is a ==cloze1==^[ass] ==cloze2==^[sha] ==cloze3==^[has]"
            let clozeAction = "s";
            if (cardIndex < deletion.seq.length) {
                clozeAction = deletion.seq[cardIndex];
            }

            switch (clozeAction) {
                case "a":
                    backText = backText.replace(deletion.raw, format.showingAnswer(deletion.answer, deletion.hint)); // Show as answer
                    break;
                case "h":
                    backText = backText.replace(deletion.raw, format.hiding(deletion.answer, deletion.hint)); // Just hide
                    break;
                case "s":
                    backText = backText.replace(deletion.raw, deletion.answer); // Just show
                    break;
            }
        }
        return backText;
    }
}
