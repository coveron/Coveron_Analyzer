import { Component, ApplicationRef } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { MenuController, AlertController } from '@ionic/angular';
import { DataStoreService } from '../data-store.service';
import { HighlightModule, HighlightJS } from 'ngx-highlightjs';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  // store for source code
  raw_source_code = []
  source_code = []
  overview_statement_markups = []
  overview_function_markups = []
  overview_evaluation_markups = []
  overview_mcdc_markups = []


  constructor(public dataStore: DataStoreService, public highlighter: HighlightJS, public alertCtrl: AlertController) {
    this.dataStore.cid_data_changed.subscribe((val) => {
      // trigger source code update
      this.get_source_code();
    });
  }

  get_percentage_color(percentage: number) {
    // 90-100% -> green (success)
    // 75-90% -> yellow (warning)
    // 0-75% -> red (danger)

    if (percentage > 0.9) {
      return 'success';
    } else if (percentage > 0.75) {
      return 'yellow';
    } else {
      return 'danger';
    }
  }

  get_execution_count() {
    return this.dataStore.cid_data.recorded_executions.toString();
  }

  get_function_coverage_color() {
    let executed_functions = this.dataStore.cid_data.code_data.executed_functions;
    let unexecuted_functions = this.dataStore.cid_data.code_data.unexecuted_functions;
    let all_functions = executed_functions + unexecuted_functions;

    return this.get_percentage_color(executed_functions / all_functions);
  }

  get_function_coverage_string() {
    let executed_functions = this.dataStore.cid_data.code_data.executed_functions;
    let unexecuted_functions = this.dataStore.cid_data.code_data.unexecuted_functions;
    let all_functions = executed_functions + unexecuted_functions;

    return '(' + executed_functions + '/' + all_functions + ") " + (100 * executed_functions / all_functions).toFixed(1) + "%";
  }


  get_statement_coverage_color() {
    let executed_statements = this.dataStore.cid_data.code_data.executed_statements;
    let unexecuted_statements = this.dataStore.cid_data.code_data.unexecuted_statements;
    let all_statements = executed_statements + unexecuted_statements;

    return this.get_percentage_color(executed_statements / all_statements);
  }

  get_statement_coverage_string() {
    let executed_statements = this.dataStore.cid_data.code_data.executed_statements;
    let unexecuted_statements = this.dataStore.cid_data.code_data.unexecuted_statements;
    let all_statements = executed_statements + unexecuted_statements;

    return '(' + executed_statements + '/' + all_statements + ") " + (100 * executed_statements / all_statements).toFixed(1) + "%";
  }


  get_branch_coverage_color() {
    let taken_branches = this.dataStore.cid_data.code_data.taken_branches;
    let nottaken_branches = this.dataStore.cid_data.code_data.nottaken_branches;
    let all_branches = taken_branches + nottaken_branches;

    return this.get_percentage_color(taken_branches / all_branches);
  }

  get_branch_coverage_string() {
    let taken_branches = this.dataStore.cid_data.code_data.taken_branches;
    let nottaken_branches = this.dataStore.cid_data.code_data.nottaken_branches;
    let all_branches = taken_branches + nottaken_branches;

    return '(' + taken_branches + '/' + all_branches + ") " + (100 * taken_branches / all_branches).toFixed(1) + "%";
  }


  get_mcdc_coverage_color() {
    let evaluated_mcdc = this.dataStore.cid_data.code_data.evaluated_mcdc;
    let notevaluated_mcdc = this.dataStore.cid_data.code_data.notevaluated_mcdc;
    let all_mcdc = evaluated_mcdc + notevaluated_mcdc;

    return this.get_percentage_color(evaluated_mcdc / all_mcdc);
  }

  get_mcdc_coverage_string() {
    let evaluated_mcdc = this.dataStore.cid_data.code_data.evaluated_mcdc;
    let notevaluated_mcdc = this.dataStore.cid_data.code_data.notevaluated_mcdc;
    let all_mcdc = evaluated_mcdc + notevaluated_mcdc;

    return '(' + evaluated_mcdc + '/' + all_mcdc + ") " + (100 * evaluated_mcdc / all_mcdc).toFixed(1) + "%";
  }



  async get_source_code() {
    if (this.dataStore.cid_data != null) {
      this.raw_source_code = atob(this.dataStore.cid_data.source_code_base64).split('\n');
      let context = this;
      this.highlighter.highlight("C++", atob(this.dataStore.cid_data.source_code_base64), true).subscribe((val) => {
        context.source_code = val.value.split("\n");
      });
    } else {
      this.raw_source_code = [];
      this.source_code = [];
    }

    this.createOverviewMarkups();
  }

  createOverviewMarkups() {
    // first up clear existing markers
    this.overview_statement_markups = [];
    this.overview_function_markups = [];
    this.overview_evaluation_markups = [];
    this.overview_mcdc_markups = [];

    // create all markers with custom placed divs for each (multiple lines get multiple divs).
    let context = this;

    // create the statement markups
    this.dataStore.cid_data['code_data']['statements'].forEach(statement => {
      for (let active_line = statement['code_section']['start_line']; active_line <= statement['code_section']['end_line']; active_line++) {
        let start_char = context.raw_source_code[active_line - 1].indexOf(context.raw_source_code[active_line - 1].trim(), 0) + 1;
        let length = context.raw_source_code[active_line - 1].trim().length;

        // set start column of first line
        if (active_line == statement['code_section']['start_line']) {
          start_char = statement['code_section']['start_column'];
        }

        // set end column of last line
        if (active_line == statement['code_section']['end_line']) {
          length = statement['code_section']['end_column'] - start_char;
        }

        context.overview_statement_markups.push(
          {
            top: (20 * (active_line - 1)) + "px",
            left: (start_char - 1) + "ch",
            width: length + "ch",
            executed: (statement.executions > 0 || false) ? true : false
          }
        )
      }
    });

    // create the function markups
    this.dataStore.cid_data['code_data']['functions'].forEach(function_data => {
      context.overview_function_markups.push(
        {
          top: (20 * (function_data.header_code_section.start_line - 1)) + "px",
          height: (20 * (function_data.inner_code_section.end_line - function_data.header_code_section.start_line + 1)) + "px",
          executed: (function_data.executions > 0 || false) ? true : false,
          function_id: function_data.function_id
        }
      )
    });

    // create the if-branch markers
    this.dataStore.cid_data['code_data']['if_branches'].forEach(if_branch_data => {
      if_branch_data['branch_results'].forEach(branch_result => {

        if (branch_result['evaluation_marker_id'] == -1) {
          return;
        }

        for (let active_line = branch_result['result_evaluation_code_section']['start_line']; active_line <= branch_result['result_evaluation_code_section']['end_line']; active_line++) {
          let start_char = context.raw_source_code[active_line - 1].indexOf(context.raw_source_code[active_line - 1].trim(), 0) + 1;
          let length = context.raw_source_code[active_line - 1].trim().length;

          // set start column of first line
          if (active_line == branch_result['result_evaluation_code_section']['start_line']) {
            start_char = branch_result['result_evaluation_code_section']['start_column'];
          }

          // set end column of last line
          if (active_line == branch_result['result_evaluation_code_section']['end_line']) {
            length = branch_result['result_evaluation_code_section']['end_column'] - start_char;
          }

          let evaluation_count = 0;

          if (branch_result['evaluations_true'] > 0) {
            evaluation_count++;
          }

          if (branch_result['evaluations_false'] > 0) {
            evaluation_count++;
          }


          context.overview_evaluation_markups.push(
            {
              top: (20 * (active_line - 1)) + "px",
              left: (start_char - 1) + "ch",
              width: length + "ch",
              evaluated_branches: evaluation_count
            }
          );
        }

        // markup conditions for mcdc coverage
        branch_result['conditions'].forEach(condition => {
          for (let condition_active_line = condition['code_section']['start_line']; condition_active_line <= condition['code_section']['end_line']; condition_active_line++) {
            let condition_start_char = context.raw_source_code[condition_active_line - 1].indexOf(context.raw_source_code[condition_active_line - 1].trim(), 0) + 1;
            let condition_length = context.raw_source_code[condition_active_line - 1].trim().length;

            // set start column of first line
            if (condition_active_line == condition['code_section']['start_line']) {
              condition_start_char = condition['code_section']['start_column'];
            }

            // set end column of last line
            if (condition_active_line == condition['code_section']['end_line']) {
              condition_length = condition['code_section']['end_column'] - condition_start_char;
            }

            context.overview_mcdc_markups.push(
              {
                top: (20 * (condition_active_line - 1)) + "px",
                left: (condition_start_char - 1) + "ch",
                width: condition_length + "ch",
                mcdc_evaluated: condition['evaluated_mcdc'] || false
              }
            );
          }
        });
      });
    });

    // create the switch-branch markers
    this.dataStore.cid_data['code_data']['switch_branches'].forEach(switch_branch_data => {
      switch_branch_data['cases'].forEach(case_data => {

        if (case_data['evaluation_marker_id'] == -1) {
          return;
        }

        for (let active_line = case_data['evaluation_code_section']['start_line']; active_line <= case_data['evaluation_code_section']['end_line']; active_line++) {
          let start_char = context.raw_source_code[active_line - 1].indexOf(context.raw_source_code[active_line - 1].trim(), 0) + 1;
          let length = context.raw_source_code[active_line - 1].trim().length;

          // set start column of first line
          if (active_line == case_data['evaluation_code_section']['start_line']) {
            start_char = case_data['evaluation_code_section']['start_column'];
          }

          // set end column of last line
          if (active_line == case_data['evaluation_code_section']['end_line']) {
            length = case_data['evaluation_code_section']['end_column'] - start_char;
          }

          let evaluation_count = 0;

          if (case_data['evaluations_true'] > 0) {
            evaluation_count++;
          }

          if (case_data['evaluations_false'] > 0) {
            evaluation_count++;
          }


          context.overview_evaluation_markups.push(
            {
              top: (20 * (active_line - 1)) + "px",
              left: (start_char - 1) + "ch",
              width: length + "ch",
              evaluated_branches: (case_data['executions'] > 0) ? 2 : 0
            }
          );
        }
      });
    });


    // create the loop markers
    this.dataStore.cid_data['code_data']['loops'].forEach(loop_data => {

      if (loop_data['evaluation_marker_id'] == -1) {
        return;
      }

      for (let active_line = loop_data['evaluation_code_section']['start_line']; active_line <= loop_data['evaluation_code_section']['end_line']; active_line++) {
        let start_char = context.raw_source_code[active_line - 1].indexOf(context.raw_source_code[active_line - 1].trim(), 0) + 1;
        let length = context.raw_source_code[active_line - 1].trim().length;

        // set start column of first line
        if (active_line == loop_data['evaluation_code_section']['start_line']) {
          start_char = loop_data['evaluation_code_section']['start_column'];
        }

        // set end column of last line
        if (active_line == loop_data['evaluation_code_section']['end_line']) {
          length = loop_data['evaluation_code_section']['end_column'] - start_char;
        }

        let evaluation_count = 0;

        if (loop_data['evaluations_true'] > 0) {
          evaluation_count++;
        }

        if (loop_data['evaluations_false'] > 0) {
          evaluation_count++;
        }


        context.overview_evaluation_markups.push(
          {
            top: (20 * (active_line - 1)) + "px",
            left: (start_char - 1) + "ch",
            width: length + "ch",
            evaluated_branches: evaluation_count
          }
        );
      }

      // markup conditions for mcdc coverage
      loop_data['conditions'].forEach(condition => {
        for (let condition_active_line = condition['code_section']['start_line']; condition_active_line <= condition['code_section']['end_line']; condition_active_line++) {
          let condition_start_char = context.raw_source_code[condition_active_line - 1].indexOf(context.raw_source_code[condition_active_line - 1].trim(), 0) + 1;
          let condition_length = context.raw_source_code[condition_active_line - 1].trim().length;

          // set start column of first line
          if (condition_active_line == condition['code_section']['start_line']) {
            condition_start_char = condition['code_section']['start_column'];
          }

          // set end column of last line
          if (condition_active_line == condition['code_section']['end_line']) {
            condition_length = condition['code_section']['end_column'] - condition_start_char;
          }

          context.overview_mcdc_markups.push(
            {
              top: (20 * (condition_active_line - 1)) + "px",
              left: (condition_start_char - 1) + "ch",
              width: condition_length + "ch",
              mcdc_evaluated: condition['evaluated_mcdc'] || false
            }
          );
        }
      });
    });


    // create the ternary expression
    this.dataStore.cid_data['code_data']['ternary_expressions'].forEach(ternary_expression_data => {

      if (ternary_expression_data['evaluation_marker_id'] == -1) {
        return;
      }

      for (let active_line = ternary_expression_data['evaluation_code_section']['start_line']; active_line <= ternary_expression_data['evaluation_code_section']['end_line']; active_line++) {
        let start_char = context.raw_source_code[active_line - 1].indexOf(context.raw_source_code[active_line - 1].trim(), 0) + 1;
        let length = context.raw_source_code[active_line - 1].trim().length;

        // set start column of first line
        if (active_line == ternary_expression_data['evaluation_code_section']['start_line']) {
          start_char = ternary_expression_data['evaluation_code_section']['start_column'];
        }

        // set end column of last line
        if (active_line == ternary_expression_data['evaluation_code_section']['end_line']) {
          length = ternary_expression_data['evaluation_code_section']['end_column'] - start_char;
        }

        let evaluation_count = 0;

        if (ternary_expression_data['evaluations_true'] > 0) {
          evaluation_count++;
        }

        if (ternary_expression_data['evaluations_false'] > 0) {
          evaluation_count++;
        }


        context.overview_evaluation_markups.push(
          {
            top: (20 * (active_line - 1)) + "px",
            left: (start_char - 1) + "ch",
            width: length + "ch",
            evaluated_branches: evaluation_count
          }
        );
      }

      // markup conditions for mcdc coverage
      ternary_expression_data['conditions'].forEach(condition => {
        for (let condition_active_line = condition['code_section']['start_line']; condition_active_line <= condition['code_section']['end_line']; condition_active_line++) {
          let condition_start_char = context.raw_source_code[condition_active_line - 1].indexOf(context.raw_source_code[condition_active_line - 1].trim(), 0) + 1;
          let condition_length = context.raw_source_code[condition_active_line - 1].trim().length;

          // set start column of first line
          if (condition_active_line == condition['code_section']['start_line']) {
            condition_start_char = condition['code_section']['start_column'];
          }

          // set end column of last line
          if (condition_active_line == condition['code_section']['end_line']) {
            condition_length = condition['code_section']['end_column'] - condition_start_char;
          }

          context.overview_mcdc_markups.push(
            {
              top: (20 * (condition_active_line - 1)) + "px",
              left: (condition_start_char - 1) + "ch",
              width: condition_length + "ch",
              mcdc_evaluated: condition['evaluated_mcdc'] || false
            }
          );
        }
      });
    });


  }

}
