export { };

exports.FunctionCovAnalyzer = class FunctionCovAnalyzer {

    cid_data: object;

    constructor(cid_data: object) {
        this.cid_data = cid_data;
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
            } else {
                this.cid_data['code_data']['unexecuted_functions'] =
                    (this.cid_data['code_data']['unexecuted_functions'] + 1) || 1;
            }
        });
    }
}