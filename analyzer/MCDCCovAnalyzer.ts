import { not } from '@angular/compiler/src/output/output_ast';
const { MarkerResult } = require('./Tools');

export { };

enum ConditionResult {
    DONTCARE = 1,
    TRUE = 2,
    FALSE = 4
};

// this module analyzes the decision coverage of the source code
// it is very similar to branch coverage, but evaluates decisions and branches in a bit different way
exports.MCDCCovAnalyzer = class MCDCCovAnalyzer {

    cid_data: object;
    mainWindow;

    constructor(cid_data: object, mainWindow) {
        this.cid_data = cid_data;
        this.mainWindow = mainWindow
    }

    start_parsing() {
        this.parse_if_branches();

        this.parse_switch_branches();

        this.parse_ternary_expressions();

        this.parse_loops();
    }

    parse_if_branches() {
        // parses the if branches for evaluations for true and false
        this.cid_data['code_data']['if_branches'].forEach(if_branch => {
            if_branch['branch_results'].forEach(branch_result => {
                let mcdc_coverage = {};
                if (!('executions' in branch_result)) {
                    mcdc_coverage = { evaluated_mcdc: 0, notevaluated_mcdc: branch_result['conditions'].length || 0 };
                } else {
                    mcdc_coverage = this.calculate_evaluation_mcdc_coverage(branch_result['executions'], branch_result['conditions']);
                }

                // write result for the specific branch
                branch_result['evaluated_mcdc'] = mcdc_coverage['evaluated_mcdc'];
                branch_result['notevaluated_mcdc'] = mcdc_coverage['notevaluated_mcdc'];

                this.add_mcdc_coverage_info(mcdc_coverage['evaluated_mcdc'],
                    mcdc_coverage['notevaluated_mcdc'],
                    if_branch['function_id']);
            });
        });
    }

    parse_switch_branches() {
        // parses the switch branches for coverage of cases
        this.cid_data['code_data']['switch_branches'].forEach(switch_branch => {
            let taken_decisions = 0;
            let nottaken_decisions = switch_branch['cases'].length;

            for (let i = 0; i < switch_branch['cases'].length; i++) {
                if ('executions' in switch_branch['cases'][i] && switch_branch['cases'][i]['executions'] > 0) {
                    taken_decisions++;
                    nottaken_decisions--;
                }
            }

            this.add_mcdc_coverage_info(taken_decisions, nottaken_decisions, switch_branch['function_id']);
        });
    }

    parse_ternary_expressions() {
        // parses the ternary expressions for evaluations for true and false
        this.cid_data['code_data']['ternary_expressions'].forEach(ternary_expression => {
            let mcdc_coverage = {};
            if (!('executions' in ternary_expression)) {
                mcdc_coverage = { evaluated_mcdc: 0, notevaluated_mcdc: ternary_expression['conditions'].length }
            } else {
                mcdc_coverage = this.calculate_evaluation_mcdc_coverage(ternary_expression['executions'], ternary_expression['conditions']);
            }

            // write result for the specific branch
            ternary_expression['evaluated_mcdc'] = mcdc_coverage['evaluated_mcdc'];
            ternary_expression['notevaluated_mcdc'] = mcdc_coverage['notevaluated_mcdc'];

            this.add_mcdc_coverage_info(mcdc_coverage['evaluated_mcdc'],
                mcdc_coverage['notevaluated_mcdc'],
                ternary_expression['function_id']);
        });
    }

    parse_loops() {
        // parses loops for evaluations for true and false
        this.cid_data['code_data']['loops'].forEach(loop => {
            let mcdc_coverage = {};
            if (!('executions' in loop)) {
                mcdc_coverage = { evaluated_mcdc: 0, notevaluated_mcdc: loop['conditions'].length }
            } else {
                mcdc_coverage = this.calculate_evaluation_mcdc_coverage(loop['executions'], loop['conditions']);
            }

            // write result for the specific branch
            loop['evaluated_mcdc'] = mcdc_coverage['evaluated_mcdc'];
            loop['notevaluated_mcdc'] = mcdc_coverage['notevaluated_mcdc'];

            this.add_mcdc_coverage_info(mcdc_coverage['evaluated_mcdc'],
                mcdc_coverage['notevaluated_mcdc'],
                loop['function_id']);
        });
    }

    add_mcdc_coverage_info(evaluated_mcdc: number, notevaluated_mcdc: number, function_id: number) {
        this.cid_data['code_data']['evaluated_mcdc'] =
            (this.cid_data['code_data']['evaluated_mcdc'] + evaluated_mcdc) || evaluated_mcdc;
        this.cid_data['code_data']['notevaluated_mcdc'] =
            (this.cid_data['code_data']['notevaluated_mcdc'] + notevaluated_mcdc) || notevaluated_mcdc;

        // add statistic to function
        this.cid_data['code_data']['functions'].forEach(functionData => {
            if (functionData['function_id'] == function_id) {
                functionData['evaluated_mcdc'] =
                    (functionData['evaluated_mcdc'] + evaluated_mcdc) || evaluated_mcdc;
                functionData['notevaluated_mcdc'] =
                    (functionData['notevaluated_mcdc'] + notevaluated_mcdc) || notevaluated_mcdc;
            }
        });
    }

    calculate_evaluation_mcdc_coverage(executions: object[], conditions: object[]) {
        let validated_conditions = 0
        let notvalidated_conditions = conditions.length

        // iterate over every condition
        for (let i = 0; i < conditions.length; i++) {
            if (this.is_condition_mcdc_evaluated(executions, conditions[i]['evaluation_marker_id'], conditions)) {
                validated_conditions++;
                notvalidated_conditions--;

                // add info to condition for more potential detailed infos in gui
                conditions[i]['evaluated_mcdc'] = true;
            } else {
                conditions[i]['evaluated_mcdc'] = false;
            }
        }

        return { evaluated_mcdc: validated_conditions, notevaluated_mcdc: notvalidated_conditions };
    }

    is_condition_mcdc_evaluated(executions: object[], evaluation_marker_id: number, conditions: object[]) {
        // filter all executions, that feature the relevant toggling condition
        let context = this;
        let relevant_executions = executions.filter(function filter(execution) {
            if (context.get_evaluation_marker_result(execution, evaluation_marker_id) != ConditionResult.DONTCARE) {
                return true;
            }
            return false;
        });

        // condition is evaluated until 
        let condition_evaluated = false;

        // iterate over all relevant_executions
        for (let i = 0; i < relevant_executions.length; i++) {

            let execution_pair_one = relevant_executions[i];

            // filter all relevant executions which can be a pair (different decision and different toggling condition)
            let context = this;
            let possible_execution_pairs = relevant_executions.filter(function filter(execution) {
                if (execution['decision_result'] != execution_pair_one['decision_result'] &&
                    context.get_evaluation_marker_result(execution, evaluation_marker_id) !=
                    context.get_evaluation_marker_result(execution_pair_one, evaluation_marker_id)) {
                    return true;
                }
                return false;
            })

            for (let j = 0; j < possible_execution_pairs.length; j++) {
                // set reference for improved code readability
                let execution_pair_two = possible_execution_pairs[j];

                // compare each condition of the pair
                for (let comp_i = 0; comp_i < conditions.length; comp_i++) {
                    let comp_evaluation_marker_id = conditions[comp_i]['evaluation_marker_id']

                    // this is the currently tested condition, so skip it
                    if (comp_evaluation_marker_id == evaluation_marker_id) {
                        // check if we're at the last item. If yes, the condition is evaluated.
                        if (comp_i == (conditions.length - 1)) {
                            condition_evaluated = true;
                            break;
                        } else {
                            // If no, we can skip this one, because it's the currently checked toggle condition
                            continue;
                        }
                    }

                    let result_1 = this.get_evaluation_marker_result(execution_pair_one, comp_evaluation_marker_id);
                    let result_2 = this.get_evaluation_marker_result(execution_pair_two, comp_evaluation_marker_id);

                    // check, if the two results are equal
                    if (result_1 == result_2 || result_1 == ConditionResult.DONTCARE || result_2 == ConditionResult.DONTCARE) {
                        // results are equal, so check if we're at the last item. If yes, the condition is evaluated
                        if (comp_i == (conditions.length - 1)) {
                            condition_evaluated = true;
                            break;
                        }
                    } else {
                        continue;
                    }
                }

                if (condition_evaluated) {
                    // we can stop checking, if we know that the condition was fully evaluated
                    break;
                }
            }
            if (condition_evaluated) {
                // we can stop checking, if we know that the condition was fully evaluated
                break;
            }
        }

        return condition_evaluated;
    }

    get_evaluation_marker_result(execution: object, evaluation_marker_id: number) {
        let condition_index = execution['conditions'].findIndex(item => item['evaluation_marker_id'] == evaluation_marker_id);
        if (condition_index > -1) {
            if (execution['conditions'][condition_index]['result'] == MarkerResult.TRUE) {
                return ConditionResult.TRUE;
            } else {
                return ConditionResult.FALSE;
            }
        } else {
            return ConditionResult.DONTCARE;
        }
    }
}