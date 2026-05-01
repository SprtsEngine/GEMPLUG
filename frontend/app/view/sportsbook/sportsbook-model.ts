// Copyright 2026, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import type { BlockNodeModel } from "@/app/block/blocktypes";
import type { TabModel } from "@/app/store/tab-model";
import { atom } from "jotai";
import { SportsbookView } from "./sportsbook";

class SportsbookViewModel implements ViewModel {
    viewType: string;
    blockId: string;
    nodeModel: BlockNodeModel;
    tabModel: TabModel;

    viewIcon = atom<string>("chart-line");
    viewName = atom<string>("Sportsbook");
    noPadding = atom<boolean>(false);

    constructor({ blockId, nodeModel, tabModel }: ViewModelInitType) {
        this.blockId = blockId;
        this.nodeModel = nodeModel;
        this.tabModel = tabModel;
        this.viewType = "sportsbook";
    }

    get viewComponent(): ViewComponent {
        return SportsbookView;
    }
}

export { SportsbookViewModel };
