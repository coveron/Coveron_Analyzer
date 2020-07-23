export { };

const { MarkerType, MarkerResult } = require("./Tools");

exports.CIDHelper = class CIDHelper {

    cid_data: object;

    constructor(cid_data: object) {
        this.cid_data = cid_data;
    }

    get_marker_type(id: number) {
        // returns the type of the marker (is found in the dict)
        if (this.cid_data['marker_data']['checkpoint_markers'].findIndex(p => p.checkpoint_marker_id == id) != -1) {
            return MarkerType.CHECKPOINT;
        } else {
            let index = this.cid_data['marker_data']['evaluation_markers'].findIndex(p => p.evaluation_marker_id == id)
            if (index < 0) return MarkerType.MISSING;
            switch (this.cid_data['marker_data']['evaluation_markers'][index]['evaluation_type']) {
                case 1:
                    return MarkerType.DECISION;
                case 2:
                    return MarkerType.CONDITION;
                default:
                    return MarkerType.MISSING;
            }
        }
    }

    add_statement_execution(id: number) {
        // increase execution counter for all statements in code data
        this.cid_data['code_data']['statements'].forEach(statement => {
            if (statement['checkpoint_marker_id'] == id) {
                statement['executions'] = (statement['executions'] + 1) || 1;
            }
        });

        // increase execution counter for all functions in code data
        this.cid_data['code_data']['functions'].forEach(functionData => {
            if (functionData['checkpoint_marker_id'] == id) {
                functionData['executions'] = (functionData['executions'] + 1) || 1;
            }
        });

        // increase execution counter for all cases in code data
        this.cid_data['code_data']['switch_branches'].forEach(switch_branch => {
            switch_branch['cases'].forEach(switchCase => {
                if (switchCase['checkpoint_marker_id'] == id) {
                    switchCase['executions'] = (switchCase['executions'] + 1) || 1;
                }
            });
        });
    }

    add_evaluation_execution(evaluation_exec_data: object) {
        // check for existence in if_branches
        this.cid_data['code_data']['if_branches'].forEach(if_branch => {
            if_branch['branch_results'].forEach(branch_result => {
                if (branch_result['evaluation_marker_id'] == evaluation_exec_data['decision_marker_id']) {
                    // add execution data
                    if ('executions' in branch_result) {
                        branch_result['executions'].push(evaluation_exec_data);
                    } else {
                        branch_result['executions'] = [evaluation_exec_data];
                    }

                    // set/increase result counters
                    if (evaluation_exec_data['decision_result'] == MarkerResult.FALSE) {
                        branch_result['evaluations_true'] = branch_result['evaluations_true'] || 0;
                        branch_result['evaluations_false'] = (branch_result['evaluations_false'] + 1) || 1;
                    } else if (evaluation_exec_data['decision_result'] == MarkerResult.TRUE) {
                        branch_result['evaluations_true'] = (branch_result['evaluations_true'] + 1) || 1;
                        branch_result['evaluations_false'] = branch_result['evaluations_false'] || 0;
                    } else {
                        throw new Error("Decision must be either true or false");
                    }

                    return;
                }
            });
        });

        // check for existence in ternary_expressions
        this.cid_data['code_data']['ternary_expressions'].forEach(ternary_expr => {
            if (ternary_expr['evaluation_marker_id'] == evaluation_exec_data['decision_marker_id']) {
                // add execution data
                if ('executions' in ternary_expr) {
                    ternary_expr['executions'].push(evaluation_exec_data);
                } else {
                    ternary_expr['executions'] = [evaluation_exec_data];
                }

                // set/increase result counters
                if (evaluation_exec_data['decision_result'] == MarkerResult.FALSE) {
                    ternary_expr['evaluations_true'] = ternary_expr['evaluations_true'] || 0;
                    ternary_expr['evaluations_false'] = (ternary_expr['evaluations_false'] + 1) || 1;
                } else if (evaluation_exec_data['decision_result'] == MarkerResult.TRUE) {
                    ternary_expr['evaluations_true'] = (ternary_expr['evaluations_true'] + 1) || 1;
                    ternary_expr['evaluations_false'] = ternary_expr['evaluations_false'] || 0;
                } else {
                    throw new Error("Decision must be either true or false");
                }

                return;
            }
        });

        // check for existence in loops
        this.cid_data['code_data']['loops'].forEach(loop => {
            if (loop['evaluation_marker_id'] == evaluation_exec_data['decision_marker_id']) {
                // add execution data
                if ('executions' in loop) {
                    loop['executions'].push(evaluation_exec_data);
                } else {
                    loop['executions'] = [evaluation_exec_data];
                }

                // set/increase result counters
                if (evaluation_exec_data['decision_result'] == MarkerResult.FALSE) {
                    loop['evaluations_true'] = loop['evaluations_true'] || 0;
                    loop['evaluations_false'] = (loop['evaluations_false'] + 1) || 1;
                } else if (evaluation_exec_data['decision_result'] == MarkerResult.TRUE) {
                    loop['evaluations_true'] = (loop['evaluations_true'] + 1) || 1;
                    loop['evaluations_false'] = loop['evaluations_false'] || 0;
                } else {
                    throw new Error("Decision must be either true or false");
                }

                return;
            }
        });
    }
}