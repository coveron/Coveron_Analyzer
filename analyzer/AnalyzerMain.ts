import { readFile } from "fs";
import { runInThisContext } from 'vm';

const pako = require('pako');
const { readFileSync, writeFile } = require("fs");
const atob = require("atob");
const btoa = require("btoa");

const { CRIParser } = require("./CRIParser");
const { FunctionCovAnalyzer } = require("./FunctionCovAnalyzer");
const { StatementCovAnalyzer } = require("./StatementCovAnalyzer");
const { DecisionCovAnalyzer } = require("./DecisionCovAnalyzer");
const { BranchCovAnalyzer } = require("./BranchCovAnalyzer");
const { MCDCCovAnalyzer } = require("./MCDCCovAnalyzer");

class AnalyzerMain {

    cid_file_content: string = null;
    cri_file_content: Uint8Array = null;

    public cid_data: object;

    mainWindow;

    constructor(cid_path: string, cri_path: string, mainWindow) {
        this.mainWindow = mainWindow;
        if (cid_path !== null) {
            try {
                this.cid_file_content = readFileSync(cid_path, 'utf-8');
                this.cid_data = JSON.parse(this.cid_file_content);
            } catch {
                // could be a compressed cid file, so try to decompress and open again
                try {
                    let deflated_content = pako.ungzip(new Uint8Array(readFileSync(cid_path)));
                    this.cid_file_content = new TextDecoder().decode(Buffer.from(deflated_content));
                    this.cid_data = JSON.parse(this.cid_file_content);
                } catch {
                    // throw new Error("CID file couldn't be opened!");
                    console.log("ERROR: CID not openable");
                    this.mainWindow.webContents.send("error_cid_not_openable");
                    this.mainWindow.webContents.send("report_closed");
                    return;
                }
            }

            // send source code filename to frontend
            let source_file_path = this.cid_data['source_code_path'].replace(/\\\\/g, "\\").replace(/\\/g, "/")
            let source_file_name = source_file_path.split("/").pop();
            this.mainWindow.webContents.send("report_info_source_file_name", { source_file_name: source_file_name });

            // check if source file is readable
            let source_file_content = null;
            try {
                source_file_content = readFileSync(source_file_path);
            } catch {

            }
            if (source_file_content != null) {
                this.mainWindow.webContents.send("report_info_original_source_file_found", { original_source_file_found: true });
                if (atob(this.cid_data['source_code_base64']).localeCompare(source_file_content) == 0) {
                    this.mainWindow.webContents.send("report_info_current_version_tested", { current_version_tested: true });
                } else {
                    this.mainWindow.webContents.send("report_info_current_version_tested", { current_version_tested: false });
                }
            } else {
                this.mainWindow.webContents.send("report_info_original_source_file_found", { original_source_file_found: false });
                this.mainWindow.webContents.send("report_info_current_version_tested", { current_version_tested: false });
            }

        } else {
            throw new Error("CID file must be given");
        }
        if (cri_path !== null) {
            try {
                this.cri_file_content = new Uint8Array(readFileSync(cri_path));
                this.parse_cri_file();
            } catch {
                // throw new Error("CRI file couldn't be opened!");
                console.log("ERROR: CRI not openable");
                this.mainWindow.webContents.send("error_cri_not_openable");
                this.mainWindow.webContents.send("report_closed");
                return;
            }
        } else {
            // try with path given in CID
            try {
                this.cri_file_content = new Uint8Array(readFileSync(this.cid_data['cri_path']))
            } catch {
                // throw new Error("CRI file couldn't be opened!");
                console.log("ERROR: CRI not openable");
                this.mainWindow.webContents.send("error_cri_not_openable");
                this.mainWindow.webContents.send("report_closed");
                return;
            }
            this.parse_cri_file();
        }

        // start function coverage analysis
        let function_cov_analyzer = new FunctionCovAnalyzer(this.cid_data, this.mainWindow);
        function_cov_analyzer.start_parsing();

        // start statement coverage analysis
        let statement_cov_analyzer = new StatementCovAnalyzer(this.cid_data, this.mainWindow);
        statement_cov_analyzer.start_parsing();

        // start decision coverage analysis
        let decision_cov_analyzer = new DecisionCovAnalyzer(this.cid_data, this.mainWindow);
        decision_cov_analyzer.start_parsing();

        // start branch coverage analysis
        let branch_cov_analyzer = new BranchCovAnalyzer(this.cid_data, this.mainWindow);
        branch_cov_analyzer.start_parsing();

        // start mcdc coverage analysis
        let mcdc_cov_analyzer = new MCDCCovAnalyzer(this.cid_data);
        mcdc_cov_analyzer.start_parsing();

        this.mainWindow.webContents.send("report_info_cid_data", { cid_data: this.cid_data });

        // writeFile("measured_output.json", JSON.stringify(this.cid_data, undefined, 4), function (err) { })
    }

    process_cri_file(input_file) {
        return function (e) {
            var bytes = e.target.result;
            this.cri_file_content.push(bytes);
        }
    }

    start_parsing() {
        // first parse the cri file and fill the cid_data with additional information
    }

    parse_cri_file() {
        let cri_parser = new CRIParser(this.cid_data, this.cri_file_content);

        // check equality of source code hash
        if (cri_parser.get_source_code_hash() != this.cid_data['source_code_hash']) {
            // throw new Error("CRI data doesn't fit to input source code");
            console.log("ERROR: CRI not fitting to CID");
            this.mainWindow.webContents.send("error_cri_not_fitting_to_cid");
            this.mainWindow.webContents.send("report_closed");
            return;
        }

        // check equality of instrumentation random
        if (cri_parser.get_instrumentation_random() != this.cid_data['instrumentation_random']) {
            // throw new Error("CRI data doesn't fit to CID data");
            console.log("ERROR: CRI not fitting to CID");
            this.mainWindow.webContents.send("error_cri_not_fitting_to_cid");
            this.mainWindow.webContents.send("report_closed");
            return;
        }

        cri_parser.start_parsing();
    }
}

exports.AnalyzerMain = AnalyzerMain;