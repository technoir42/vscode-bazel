// Copyright 2018 The Bazel Authors. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as path from "path";
import * as vscode from "vscode";
import {
  BazelWorkspaceInfo,
  IBazelCommandAdapter,
  IBazelCommandOptions,
  QueryLocation,
} from "../bazel";
import * as blaze_query from "../protos/src/main/protobuf/build_pb";
import { IBazelTreeItem } from "./bazel_tree_item";
import { getBazelRuleIcon } from "./icons";

/** A tree item representing a build target. */
export class BazelTargetTreeItem
  implements IBazelCommandAdapter, IBazelTreeItem {
  /**
   * Initializes a new tree item with the given query result representing a
   * build target.
   *
   * @param target An object representing a build target that was produced by a
   *     query.
   */
  constructor(
    private readonly workspaceInfo: BazelWorkspaceInfo,
    private readonly target: blaze_query.Target,
  ) {}

  public mightHaveChildren(): boolean {
    return false;
  }

  public getChildren(): Thenable<IBazelTreeItem[]> {
    return Promise.resolve([]);
  }

  public getLabel(): string {
    const fullPath = this.target.getRule().getName();
    const colonIndex = fullPath.lastIndexOf(":");
    const targetName = fullPath.substr(colonIndex);
    return `${targetName}  (${this.target.getRule().getRuleClass()})`;
  }

  public getIcon(): vscode.ThemeIcon | string {
    return getBazelRuleIcon(this.target);
  }

  public getTooltip(): string {
    return `${this.target.getRule().getName()}`;
  }

  public getCommand(): vscode.Command | undefined {
    const location = new QueryLocation(this.target.getRule().getLocation());
    return {
      arguments: [
        vscode.Uri.file(location.path),
        { selection: location.range },
      ],
      command: "vscode.open",
      title: "Jump to Build Target",
    };
  }

  public getContextValue(): string {
    const ruleClass = this.target.getRule().getRuleClass();
    if (ruleClass.endsWith("_test") || ruleClass === "test_suite") {
      return "testRule";
    }
    return "rule";
  }

  public getBazelCommandOptions(): IBazelCommandOptions {
    const location = new QueryLocation(this.target.getRule().getLocation());
    const workingDirectory = path.dirname(location.path);
    return {
      options: [],
      targets: [`${this.target.getRule().getName()}`],
      workspaceInfo: this.workspaceInfo,
    };
  }
}
