const { readFileSync } = require("fs");
const { CRIParser } = require("./CRIParser");

class AnalyzerMain {

    cid_file_content: string = null;
    cri_file_content: Uint8Array = null;

    cid_data: object;

    constructor(cid_path: string, cri_path: string) {
        if (cid_path !== null) {
            try {
                this.cid_file_content = readFileSync(cid_path, 'utf-8');
                this.parse_cid_file();
            } catch {
                throw new Error("CID file couldn't be opened!");

            }
        } else {
            throw new Error("CID file must be given");
        }
        if (cri_path !== null) {
            try {
                this.cri_file_content = new Uint8Array(readFileSync(cri_path));
                this.parse_cri_file();
            } catch {
                throw new Error("CRI file couldn't be opened!");
            }
        } else {
            // try with path given in CID
            try {
                this.cri_file_content = new Uint8Array(readFileSync(this.cid_data['cri_path']))
                this.parse_cri_file();
            } catch {
                throw new Error("CRI file couldn't be opened!");

            }
        }
    }

    process_cri_file(input_file) {
        return function (e) {
            var bytes = e.target.result;
            this.cri_file_content.push(bytes);
        }
    }

    parse_cid_file() {
        this.cid_data = JSON.parse(this.cid_file_content);
    }

    start_parsing() {
        // first parse the cri file and fill the cid_data with additional information
    }

    parse_cri_file() {
        let cri_parser = new CRIParser(this.cid_data, this.cri_file_content);

        // check equality of source code hash
        if (cri_parser.get_source_code_hash() != this.cid_data['source_code_hash']) {
            throw new Error("CRI data doesn't fit to input source code");
        }

        // check equality of instrumentation random
        if (cri_parser.get_instrumentation_random() != this.cid_data['instrumentation_random']) {
            throw new Error("CRI data doesn't fit to CID data");
        }

        cri_parser.start_parsing();
    }
}

exports.AnalyzerMain = AnalyzerMain;