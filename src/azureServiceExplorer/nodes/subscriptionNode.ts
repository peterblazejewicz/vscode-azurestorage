/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { SubscriptionModels } from 'azure-arm-resource';
import * as path from 'path';

import { AzureTreeNodeBase } from './azureTreeNodeBase';
import { AzureTreeDataProvider } from '../azureTreeDataProvider';
import { AccountManager } from '../accountManager';
import { ISubscriptionChildrenProvider } from '../ISubscriptionChildrenProvider';
import { AzureLoadMoreTreeNodeBase } from './azureLoadMoreTreeNodeBase';

export class SubscriptionNode extends AzureLoadMoreTreeNodeBase {
    private _subscriptionChildrenDataProviders: ISubscriptionChildrenProvider[];

    constructor(readonly subscription: SubscriptionModels.Subscription, treeDataProvider: AzureTreeDataProvider, parentNode: AzureTreeNodeBase | undefined, subscriptionChildrenDataProviders: ISubscriptionChildrenProvider[]) {
        super(subscription.displayName, treeDataProvider, parentNode);
        this._subscriptionChildrenDataProviders = subscriptionChildrenDataProviders;
    }

    getTreeItem(): TreeItem {
        return {
            label: this.label,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
            contextValue: 'subscription',
            iconPath: {
                light: path.join(__filename, '..', '..', '..', '..', '..', 'resources', 'light', 'AzureSubscription_16x.svg'),
                dark: path.join(__filename, '..', '..', '..', '..', '..', 'resources', 'dark', 'AzureSubscription_16x.svg')
            }
        }
    }

    async getMoreChildren(): Promise<AzureTreeNodeBase[]> {
        if (this.azureAccount.signInStatus !== 'LoggedIn') {
            return [];
        }

        var childrenPromises = [];
        this._subscriptionChildrenDataProviders.forEach((childProvider) => {
            childrenPromises.push(childProvider.getMoreChildren(this.azureAccount, this.subscription, this.treeDataProvider, this));
        })

        return await Promise.all(childrenPromises).then((childrenResults: AzureTreeNodeBase[][]) => {
            return [].concat.apply([], childrenResults);
        });
    }

    hasMoreChildren(): boolean {
        return this._subscriptionChildrenDataProviders.some(( childProvider ) => {
            return childProvider.hasMoreChildren();
        });
    }

    private get azureAccount(): AccountManager {
        return this.treeDataProvider.azureAccount;
    }
}
