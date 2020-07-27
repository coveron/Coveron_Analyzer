export { };

exports.FunctionCovAnalyzer = class FunctionCovAnalyzer {

    cid_data: object;
    mainWindow;

    constructor(cid_data: object, mainWindow) {
        this.cid_data = cid_data;
        this.mainWindow = mainWindow
    }

    start_parsing() {
        this.parse_functions();
    }

    parse_functions() {
        // checks every function for execution
        this.cid_data['code_data']['functions'].forEach(functionData => {
            if ('executions' in functionData) {
                this.cid_data['code_data']['executed_functions'] =
                    (this.cid_data['code_data']['executed_functions'] + 1) || 1;
                this.cid_data['code_data']['unexecuted_functions'] =
                    this.cid_data['code_data']['unexecuted_functions'] || 0;
            } else {
                this.cid_data['code_data']['unexecuted_functions'] =
                    (this.cid_data['code_data']['unexecuted_functions'] + 1) || 1;
                this.cid_data['code_data']['executed_functions'] =
                    this.cid_data['code_data']['executed_functions'] || 0;
            }
        });
    }
}