import { Component } from '@angular/core';
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
  source_code = []

  overview_markers = "";
  checkpoint_markers = "";
  evaluation_markers = "";


  // selector for active segment
  active_source_viewer_segment = "overview";

  constructor(public dataStore: DataStoreService, public highlighter: HighlightJS) {
    this.dataStore.cid_data_changed.subscribe((val) => {
      // trigger source code update
      this.get_source_code();
    });
  }

  segment_changed(ev) {
    // console.log(this.active_source_viewer_segment);
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
      let context = this;
      this.highlighter.highlight("C++", atob(this.dataStore.cid_data.source_code_base64), true).subscribe((val) => {
        context.source_code = val.value.split("\n");
      });
    } else {
      this.source_code = [];
    }
  }

  async createOverviewMarkers() {
    // create all markers with custom placed divs for each (multiple lines get multiple divs).
    // Then set the resulting string to the overview_markers var
  }

  async createCheckpointMarkers() {
    // create all markers with custom placed divs for each (multiple lines get multiple divs).
    // Then set the resulting string to the checkpoint_markers var
  }

  async createEvaluationMarkers() {
    // create all markers with custom placed divs for each (multiple lines get multiple divs).
    // Then set the resulting string to the evaluation_markers var
  }


}
