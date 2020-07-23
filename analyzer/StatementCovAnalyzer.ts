import { stat } from "fs";

const { MarkerType, MarkerResult } = require("./Tools");

exports.StatementCovAnalyzer = class StatementCovAnalyzer {

    cid_data: object;

    constructor(cid_data: object) {
        this.cid_data = cid_data;
    }

    start_parsing() {
        this.parse_statements();

        this.parse_if_branches();

        this.parse_switch_branches();

        this.parse_loops();
    }

    parse_statements() {
        // checks every statement for execution.
        this.cid_data['code_data']['statements'].forEach(statement => {
            let statement_executed = 0;
            if ('executions' in statement && statement['executions'] > 0) {
                statement_executed = 1;
            }

            this.add_statement_coverage_info(statement_executed, statement['function_id']);
        });
    }

    parse_if_branches() {
        // parses the evaluation statements for execution (check if evaluation was made).
        this.cid_data['code_data']['if_branches'].forEach(if_branch => {
            if_branch['branch_results'].forEach(branch_result => {
                let statement_executed = 0;
                if ('executions' in branch_result && branch_result['executions'].length > 0) {
                    statement_executed = 1;
                }

                this.add_statement_coverage_info(statement_executed, if_branch['function_id']);
            });
        });
    }

    parse_switch_branches() {
        // parses the switch statement for execution (check, if any case was executed).
        this.cid_data['code_data']['switch_branches'].forEach(switch_branch => {
            let statement_executed = 0;
            if (switch_branch['cases'].findIndex(p => ('executions' in p && p['executions'] > 0)) != -1) {
                statement_executed = 1;
            }

            this.add_statement_coverage_info(statement_executed, switch_branch['function_id']);
        });
    }

    parse_loops() {
        // parses the loops for execution (check if evaluation was made).
        this.cid_data['code_data']['loops'].forEach(loop => {
            let statement_executed = 0;
            if ('executions' in loop && loop['executions'].length > 0) {
                statement_executed = 1;
            }

            this.add_statement_coverage_info(statement_executed, loop['function_id']);
        });
    }

    add_statement_coverage_info(statement_executed: number, function_id: number) {
        this.cid_data['code_data']['executed_statements'] =
            (this.cid_data['code_data']['executed_statements'] + statement_executed) || statement_executed;
        this.cid_data['code_data']['unexecuted_statements'] =
            (this.cid_data['code_data']['unexecuted_statements'] + 1 - statement_executed) || (1 - statement_executed);

        // add statistic to function
        this.cid_data['code_data']['functions'].forEach(functionData => {
            if (functionData['function_id'] == function_id) {
                functionData['executed_statements'] =
                    (functionData['executed_statements'] + statement_executed) || statement_executed;
                functionData['unexecuted_statements'] =
                    (functionData['unexecuted_statements'] + 1 - statement_executed) || (1 - statement_executed);
            }
        });
    }

}