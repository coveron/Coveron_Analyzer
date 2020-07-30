import { Component, ApplicationRef } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { MenuController } from '@ionic/angular';
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


  // selector for active segment
  active_source_viewer_segment = "overview";

  constructor(public dataStore: DataStoreService, public highlighter: HighlightJS, public appRef: ApplicationRef) {
    this.dataStore.cid_data_changed.subscribe((val) => {
      // trigger source code update
      this.get_source_code();
    });
  }

  segment_changed(ev) {
    this.appRef.tick();
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
    this.createCheckpointMarkups();
    this.createEvaluationMarkups();
  }

  createOverviewMarkups() {
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
  }

  createCheckpointMarkups() {
    // create all markups with custom placed divs for each (multiple lines get multiple divs).
  }

  createEvaluationMarkups() {
    // create all markups with custom placed divs for each (multiple lines get multiple divs).
  }


}
