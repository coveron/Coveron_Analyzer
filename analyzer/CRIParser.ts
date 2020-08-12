export { };

const { MarkerType, MarkerResult, from2BytesToNumber, from4BytesToNumber } = require("./Tools");
const { CIDHelper } = require("./CIDHelper");

class CRIParser {

    cid_data: object;
    cri_file_content: Uint8Array;
    cid_helper;

    temp_condition_markers = [];


    constructor(cid_data: object, cri_file_content: Uint8Array) {
        this.cid_data = cid_data;
        this.cri_file_content = cri_file_content;

        // parse the header in order to check validity
        if (!this.parse_header()) {
            throw new Error("CRI file doesn't include a valid CRI header!");
        }

        // create CIDHelper instance
        this.cid_helper = new CIDHelper(cid_data);
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
            this.cid_data['recorded_executions'] = (this.cid_data['recorded_executions'] + 1) || 1;
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

        // iterate over all remaining data (all the markers)
        for (null; cursor < execution_data.length; cursor += 5) {
            // check if the data is corrupted (remaining data length is less than one full marker)
            if (execution_data.length - cursor < 5) {
                throw new Error("Corrupted marker data");
            }

            let marker_id = from4BytesToNumber(new Uint8Array(execution_data.slice(cursor, cursor + 4)));

            // check, if this is a condition marker (temporarily save in condition store)
            if (this.cid_helper.get_marker_type(marker_id) == MarkerType.CONDITION) {
                let marker_result;
                if (execution_data[cursor + 4] == 0x00) {
                    marker_result = MarkerResult.FALSE;
                } else if (execution_data[cursor + 4] == 0x01) {
                    marker_result = MarkerResult.TRUE;
                } else {
                    throw new Error("Marker data corrupted! Evaluation result value is not acceptable.");
                }

                this.temp_condition_markers.push({ "evaluation_marker_id": marker_id, "result": marker_result });

                continue;
            }

            // check, if this is a decision marker (load data from temporary store and clear it)
            if (this.cid_helper.get_marker_type(marker_id) == MarkerType.DECISION) {
                if (this.temp_condition_markers.length == 0) {
                    throw new Error("Marker data corrupted! Expected condition evaluation before decision evaluation.");
                }
                let marker_result;
                if (execution_data[cursor + 4] == 0x00) {
                    marker_result = MarkerResult.FALSE;
                } else if (execution_data[cursor + 4] == 0x01) {
                    marker_result = MarkerResult.TRUE;
                } else {
                    throw new Error("Marker data corrupted! Evaluation result value is not acceptable.");
                }

                // create data for CIDHelper
                let evaluation_exec_data = { "decision_marker_id": marker_id, "decision_result": marker_result, "conditions": this.temp_condition_markers.slice() }

                // clear temp evaluation marker storage
                this.temp_condition_markers = [];

                this.cid_helper.add_evaluation_execution(evaluation_exec_data);

                continue;
            }

            // check, if this is a checkpoint marker
            if (this.cid_helper.get_marker_type(marker_id) == MarkerType.CHECKPOINT) {
                this.cid_helper.add_statement_execution(marker_id);
            }
        }

    }

}

exports.CRIParser = CRIParser;