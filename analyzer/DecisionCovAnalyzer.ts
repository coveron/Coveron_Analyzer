import { not } from '@angular/compiler/src/output/output_ast';

export { };

// this module analyzes the decision coverage of the source code
// it is very similar to branch coverage, but evaluates decisions and branches in a bit different way
exports.DecisionCovAnalyzer = class DecisionCovAnalyzer {

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
                let taken_decisions = 0
                let nottaken_decisions = 2
                if ('executions' in branch_result &&
                    branch_result['evaluations_true'] > 0 && branch_result['evaluations_false'] > 0) {
                    // both decision paths taken
                    taken_decisions = 2
                    nottaken_decisions = 0
                } else if ('executions' in branch_result &&
                    (branch_result['evaluations_true'] > 0 || branch_result['evaluations_false'] > 0)) {
                    // one decision path taken
                    taken_decisions = 1
                    nottaken_decisions = 1
                } else {
                    // no decision taken
                    taken_decisions = 0
                    nottaken_decisions = 2
                }

                this.add_decision_coverage_info(taken_decisions, nottaken_decisions, if_branch['function_id']);
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

            this.add_decision_coverage_info(taken_decisions, nottaken_decisions, switch_branch['function_id']);
        });
    }

    parse_ternary_expressions() {
        // parses the ternary epxressions for evaluations for true and false
        this.cid_data['code_data']['ternary_expressions'].forEach(ternary_expression => {
            let taken_decisions = 0
            let nottaken_decisions = 2
            if ('executions' in ternary_expression &&
                ternary_expression['evaluations_true'] > 0 && ternary_expression['evaluations_false'] > 0) {
                // both decision paths taken
                taken_decisions = 2
                nottaken_decisions = 0
            } else if ('executions' in ternary_expression &&
                (ternary_expression['evaluations_true'] > 0 || ternary_expression['evaluations_false'] > 0)) {
                // one decision path taken
                taken_decisions = 1
                nottaken_decisions = 1
            } else {
                // no decision taken
                taken_decisions = 0
                nottaken_decisions = 2
            }

            this.add_decision_coverage_info(taken_decisions, nottaken_decisions, ternary_expression['function_id']);
        });
    }

    parse_loops() {
        // parses loops for evaluations for true and false
        this.cid_data['code_data']['loops'].forEach(loop => {
            let taken_decisions = 0
            let nottaken_decisions = 2
            if ('executions' in loop &&
                loop['evaluations_true'] > 0 && loop['evaluations_false'] > 0) {
                // both decision paths taken
                taken_decisions = 2
                nottaken_decisions = 0
            } else if ('executions' in loop &&
                (loop['evaluations_true'] > 0 || loop['evaluations_false'] > 0)) {
                // one decision path taken
                taken_decisions = 1
                nottaken_decisions = 1
            } else {
                // no decision taken
                taken_decisions = 0
                nottaken_decisions = 2
            }

            this.add_decision_coverage_info(taken_decisions, nottaken_decisions, loop['function_id']);
        });
    }

    add_decision_coverage_info(taken_decisions: number, nottaken_decisions: number, function_id: number) {
        this.cid_data['code_data']['taken_decisions'] =
            (this.cid_data['code_data']['taken_decisions'] + taken_decisions) || taken_decisions;
        this.cid_data['code_data']['nottaken_decisions'] =
            (this.cid_data['code_data']['nottaken_decisions'] + nottaken_decisions) || nottaken_decisions;

        // add statistic to function
        this.cid_data['code_data']['functions'].forEach(functionData => {
            if (functionData['function_id'] == function_id) {
                functionData['taken_decisions'] =
                    (functionData['taken_decisions'] + taken_decisions) || taken_decisions;
                functionData['nottaken_decisions'] =
                    (functionData['nottaken_decisions'] + nottaken_decisions) || nottaken_decisions;
            }
        });
    }
}