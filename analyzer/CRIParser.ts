import { exec } from 'child_process';

export { };

const { from2BytesToNumber, from4BytesToNumber } = require("./Tools");

class CRIParser {

    cid_data: object;
    cri_file_content: Uint8Array;


    constructor(cid_data: object, cri_file_content: Uint8Array) {
        this.cid_data = cid_data;
        this.cri_file_content = cri_file_content;

        // parse the header in order to check validity
        if (!this.parse_header()) {
            throw new Error("CRI file doesn't include a valid CRI header!");
        }
    }

    parse_header() {
        // check the magic number at the beginning and the header end line break
        if (!this.check_magic_number() || !this.check_header_end()) {
            return false;
        }
        return true;
    }

    check_magic_number() {
        // check the magic number at the start of the file
        if (JSON.stringify(this.cri_file_content.slice(0, 8)) == JSON.stringify(new Uint8Array([0x49, 0x4D, 0x41, 0x43, 0x52, 0x49, 0x46, 0x21]))) {
            return true;
        }
        return false;
    }

    check_header_end() {
        // check, if the line break at header end exists
        if (this.cri_file_content[58] == 0x0A) {
            return true;
        }
        return false;
    }

    get_cri_file_version() {
        return from2BytesToNumber(this.cri_file_content.slice(8, 10));
    }

    get_source_code_hash() {
        return Buffer.from(this.cri_file_content.slice(10, 42)).toString('hex');
    }

    get_instrumentation_random() {
        return Buffer.from(this.cri_file_content.slice(42, 58)).toString('hex');
    }

    start_parsing() {
        // create reference executions header
        let execution_header_ref = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x52, 0x55, 0x4E, 0x21]);

        // compare every position in the execution data with the reference header to check, if it's a new execution
        let execution_indexes: number[] = [];
        for (let i = 58; i < this.cri_file_content.length; i++) {
            for (let y = 0; y < execution_header_ref.length; y++) {
                if (this.cri_file_content[i + y] != execution_header_ref[y]) {
                    break;
                } else if (y == execution_header_ref.length - 1) {
                    execution_indexes.push(i + y + 1);
                }
            }
        }

        // get execution data
        let execution_data: Uint8Array[] = [];
        for (let i = 0; i < execution_indexes.length; i++) {
            if (i < (execution_indexes.length - 1)) {
                execution_data.push(this.cri_file_content.slice(execution_indexes[i], execution_indexes[i + 1] - execution_header_ref.length));
            } else {
                execution_data.push(this.cri_file_content.slice(execution_indexes[i]));
            }
        }

        // start parsing for every execution
        execution_data.forEach(execution => {
            this.start_execution_parsing(execution);
        });
    }

    start_execution_parsing(execution_data: Uint8Array) {
        // create index cursor for parsing
        let cursor = 0;

        // get execution comment
        let execution_comment = "";
        for (null; cursor < execution_data.length; cursor++) {
            if (execution_data[cursor] == 0x00 && execution_data[cursor + 1] == 0x0A) {
                // this is the end of the execution comment, so jump 2 chars to the markers and leave this loop
                cursor = cursor + 2;
                break;
            } else {
                execution_comment += String.fromCharCode(execution_data[cursor]);
            }
        }

        // if existing, clear execution comment from quotation marks
        if (execution_comment[0] == "\"" && execution_comment[execution_comment.length - 1] == "\"") {
            execution_comment = execution_comment.slice(1, execution_comment.length - 1);
        }

        console.log("Execution comment: " + execution_comment)

    }

}

exports.CRIParser = CRIParser;