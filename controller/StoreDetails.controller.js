sap.ui.define(
    [
        "andrey/filimonov/controller/BaseController.controller",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/Sorter",
        "sap/m/MessageBox",
        "sap/m/MessageToast",
    ],
    function (
        BaseController,
        JSONModel,
        Filter,
        FilterOperator,
        Sorter,
        MessageBox,
        MessageToast
    ) {
        "use strict";

        /**
         * Contein current store id
         */
        var sStoreID;

        return BaseController.extend(
            "andrey.filimonov.controller.StoreDetails",
            {
                /**
                 * Controller's "init" lifecycle method.
                 */
                onInit: function () {
                    this.myGetRouter()
                        .getRoute("StoreDetailsRoute")
                        .attachPatternMatched(this.onPatternMatched, this);

                    var oStoresDeteilsModel = new JSONModel({
                        ALL: 0,
                        OK: 0,
                        STORAGE: 0,
                        OUT_OF_STOCK: 0,
                        sortType: "SORT_NONE",
                        lastSorted: "",
                        sortIcon: "sort",
                        edit: false,
                        titleDialog: "",
                    });
                    this.oStoresDeteilsModel = oStoresDeteilsModel;

                    this.getView().setModel(
                        oStoresDeteilsModel,
                        "StoresDeteils"
                    );

                    this._mFilters = {
                        OK: [new Filter("Status", FilterOperator.EQ, "OK")],
                        STORAGE: [
                            new Filter("Status", FilterOperator.EQ, "STORAGE"),
                        ],
                        OUT_OF_STOCK: [
                            new Filter(
                                "Status",
                                FilterOperator.EQ,
                                "OUT_OF_STOCK"
                            ),
                        ],
                        ALL: [],
                    };

                    var oMessageManager = sap.ui.getCore().getMessageManager();
                    this.oMessageManager = oMessageManager;

                    oMessageManager.registerObject(this.getView(), true);
                },

                /**
                 * "View" after rendering lifecycle method. (wait until bindings are established). Provide counting of status conditions
                 */
                onAfterRendering: function () {
                    var oOdataModel = this.getView().getModel("odata");
                    var oProductsTable = this.byId("idTableGoods");
                    var oCountModel = this.getView().getModel("StoresDeteils");

                    oProductsTable
                        .getBinding("items")
                        .attachDataReceived(function () {
                            var oCtx =
                                oProductsTable.getBindingContext("odata");
                            var sStoresPath = oOdataModel.createKey(
                                "/Stores",
                                oCtx.getObject()
                            );
                            var aStatuses = [
                                "ALL",
                                "OK",
                                "STORAGE",
                                "OUT_OF_STOCK",
                            ];

                            aStatuses.forEach(function (sStatus) {
                                var oParams = {
                                    success: function (sCount) {
                                        oCountModel.setProperty(
                                            "/" + sStatus,
                                            sCount
                                        );
                                    },
                                };
                                if (sStatus !== "ALL") {
                                    oParams.filters = [
                                        new Filter(
                                            "Status",
                                            FilterOperator.EQ,
                                            sStatus
                                        ),
                                    ];
                                }
                                oOdataModel.read(
                                    sStoresPath + "/rel_Products/$count",
                                    oParams
                                );
                            });
                        });
                },

                /**
                 * "ProductDetails" route pattern matched event handler. Get id of current store and bind data model
                 *
                 * @param {sap.ui.base.Event} oEvent event object.
                 */
                onPatternMatched: function (oEvent) {
                    var mRouteArguments = oEvent.getParameter("arguments");
                    sStoreID = mRouteArguments.StoreID;
                    var oODataModel = this.getView().getModel("odata");
                    oODataModel.metadataLoaded().then(() => {
                        var sKey = oODataModel.createKey("/Stores", {
                            id: sStoreID,
                        });
                        //Another way to set object on the View
                        //**************** */
                        // const oContext = new sap.ui.model.Context(
                        //     oODataModel,
                        //     sKey
                        // );
                        // this.getView().setBindingContext(oContext, "odata");
                        //******************************* */
                        this.getView().bindObject({
                            path: sKey,
                            model: "odata",
                        });
                    });
                },

                /**
                 * Go to "StoresOverview" page.
                 */
                goToStoreOverview: function () {
                    this.myGetRouter().navTo("StoresOverview");
                },

                /**
                 * Go to "ProductDetails" page.
                 */
                goToProductDeteils: function (oEvent) {
                    var oSelectedListItem = oEvent.getParameter("listItem");
                    oSelectedListItem.setSelected(false);
                    var oCtx = oSelectedListItem.getBindingContext("odata");
                    this.myGetRouter().navTo("ProductDetailsRoute", {
                        StoreID: sStoreID,
                        ProductID: oCtx.getProperty("id"),
                    });
                },

                /**
                 * Searching among product list event handler.
                 *
                 * @param {sap.ui.base.Event} oEvent event object
                 */
                onProductsSearch: function (oEvent) {
                    var oTableProducts = this.byId("idTableGoods");
                    var oItemsBinding = oTableProducts.getBinding("items");
                    var sQuery = oEvent.getParameter("query");
                    var oFilter = new Filter({
                        filters: [
                            new Filter({
                                path: "Name",
                                operator: FilterOperator.Contains,
                                value1: sQuery,
                            }),
                            new Filter({
                                path: "Specs",
                                operator: FilterOperator.Contains,
                                value1: sQuery,
                            }),
                            new Filter({
                                path: "SupplierInfo",
                                operator: FilterOperator.Contains,
                                value1: sQuery,
                            }),
                            new Filter({
                                path: "MadeIn",
                                operator: FilterOperator.Contains,
                                value1: sQuery,
                            }),
                            new Filter({
                                path: "ProductionCompanyName",
                                operator: FilterOperator.Contains,
                                value1: sQuery,
                            }),
                        ],
                        and: false,
                    });
                    oItemsBinding.filter(oFilter);
                },

                /**
                 * Sorting columns in product table.
                 *
                 * @param {sap.ui.base.Event} oEvent event object
                 */
                onSortButtonPress: function (oEvent) {
                    var sLastSorted =
                        this.oStoresDeteilsModel.getProperty("/lastSorted");
                    var oItem = oEvent.getSource();
                    this.oStoresDeteilsModel.setProperty(
                        "/sortIcon",
                        "nonsort"
                    );
                    this.oStoresDeteilsModel.updateBindings(true);
                    var sSortingColumn = oItem.data("sortName");
                    if (sLastSorted !== sSortingColumn) {
                        this.oStoresDeteilsModel.setProperty(
                            "/lastSorted",
                            sSortingColumn
                        );
                        this.oStoresDeteilsModel.setProperty(
                            "/sortType",
                            "SORT_NONE"
                        );
                    }
                    var sSortType =
                        this.oStoresDeteilsModel.getProperty("/sortType");
                    switch (sSortType) {
                        case "SORT_NONE": {
                            sSortType = "SORT_ASC";
                            oItem.setIcon("sap-icon://sort-ascending");
                            break;
                        }
                        case "SORT_ASC": {
                            sSortType = "SORT_DESC";
                            oItem.setIcon("sap-icon://sort-descending");
                            break;
                        }
                        case "SORT_DESC": {
                            sSortType = "SORT_NONE";
                            break;
                        }
                    }
                    this.oStoresDeteilsModel.setProperty(
                        "/sortType",
                        sSortType
                    );
                    var oProductsTable = this.byId("idTableGoods");
                    var oItemsBinding = oProductsTable.getBinding("items");
                    if (sSortType === "SORT_NONE") {
                        oItemsBinding.sort([]);
                    } else {
                        var bSortDesc = sSortType === "SORT_DESC";
                        var oSorter = new Sorter(sSortingColumn, bSortDesc);

                        oItemsBinding.sort(oSorter);
                    }
                },

                /**
                 * Reset sorting icons in "View" to default value
                 * @param {String} sSortType type of sorting
                 * @returns {String} name for sorting icon
                 */
                sortTypeFormatter: function (sSortType) {
                    switch (sSortType) {
                        case "sort": {
                            return "sort";
                        }
                        default: {
                            return "sort";
                        }
                    }
                },

                /**
                 * Filter products in table based on status.
                 *
                 * @param {sap.ui.base.Event} oEvent event object
                 */
                onFilterSelect: function (oEvent) {
                    var oTableProducts = this.byId("idTableGoods");
                    var oBinding = oTableProducts.getBinding("items"),
                        sKey = oEvent.getParameter("selectedKey");
                    oBinding.filter(this._mFilters[sKey]);
                },

                /**
                 * Delete current store button press event handler
                 */
                onDeleteStore: function () {
                    var sMessageConfirm = this.getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("ConfirmDeleteStore");
                    MessageBox.confirm(sMessageConfirm, {
                        initialFocus: sap.m.MessageBox.Action.CANCEL,
                        onClose: (sButton) => {
                            if (sButton === MessageBox.Action.OK) {
                                var oODataModel =
                                    this.getView().getModel("odata");

                                var sKey = `/Stores(${sStoreID})`;

                                oODataModel.remove(sKey, {
                                    success: () => {
                                        var sMessage = this.getView()
                                            .getModel("i18n")
                                            .getResourceBundle()
                                            .getText(
                                                "MessageSuccessfulDeleteStore"
                                            );
                                        MessageToast.show(sMessage);
                                        this.goToStoreOverview();
                                    },
                                    error: function () {
                                        var sMessage = this.getView()
                                            .getModel("i18n")
                                            .getResourceBundle()
                                            .getText(
                                                "MessageErrorDeletingStore"
                                            );
                                        MessageBox.error(sMessage);
                                    },
                                });
                            }
                        },
                    });
                },

                /**
                 *Open dialog creating new product button press event handler
                 */
                onOpenDialogCreateProduct: function () {
                    this.oStoresDeteilsModel.setProperty("/edit", false);
                    var sTitle = this.getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("TitleDialogCreateProduct");
                    this.oStoresDeteilsModel.setProperty(
                        "/titleDialog",
                        sTitle
                    );
                    var oPromiseDialog;
                    if (!this.oDialog) {
                        oPromiseDialog = this.loadFragment({
                            name: "andrey.filimonov.view.fragments.CreateOrEditProductDialog",
                        }).then(
                            function (oDialog) {
                                this.oDialog = oDialog;
                            }.bind(this)
                        );
                    } else {
                        oPromiseDialog = Promise.resolve();
                    }
                    oPromiseDialog.then(() => {
                        var oODataModel = this.getView().getModel("odata");
                        var oEntryCtx = oODataModel.createEntry("/Products", {
                            properties: {
                                StoreId: sStoreID,
                            },
                        });
                        this.oDialog.setBindingContext(oEntryCtx);
                        this.oDialog.setModel(oODataModel);
                        this.oDialog.open();
                    });
                },

                /**
                 *Open dialog edit product button press event handler
                 *
                 * @param {sap.ui.base.Event} oEvent event object
                 */
                onOpenDialogEditProduct: function (oEvent) {
                    this.oStoresDeteilsModel.setProperty("/edit", true);
                    var sTatle = this.getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("TitleDialogEditProduct");
                    this.oStoresDeteilsModel.setProperty(
                        "/titleDialog",
                        sTatle
                    );
                    var oSelectedListItem = oEvent.getSource();
                    var oCtx = oSelectedListItem.getBindingContext("odata");
                    var oODataModel = this.getView().getModel("odata");
                    var oPromiseDialog;
                    if (!this.oDialog) {
                        oPromiseDialog = this.loadFragment({
                            name: "andrey.filimonov.view.fragments.CreateOrEditProductDialog",
                        }).then(
                            function (oDialog) {
                                this.oDialog = oDialog;
                            }.bind(this)
                        );
                    } else {
                        oPromiseDialog = Promise.resolve();
                    }
                    oPromiseDialog.then(
                        function () {
                            this.oDialog.setBindingContext(oCtx);
                            this.oDialog.setModel(oODataModel);
                            this.oDialog.open();
                        }.bind(this)
                    );
                },

                /**
                 * "Cancel button press event handler (in the dialog creating new product).
                 */
                onCancelPress: function () {
                    this.oMessageManager.removeAllMessages();
                    var oODataModel = this.getView().getModel("odata");
                    var oCtx = this.oDialog.getBindingContext();
                    oODataModel.deleteCreatedEntry(oCtx);
                    this.oDialog.close();
                },

                /**
                 * "Cancel button press event handler (in the dialog edit product).
                 */
                onCancelFromEditPress: function () {
                    this.oMessageManager.removeAllMessages();
                    this.oDialog.close();
                    var oODataModel = this.getView().getModel("odata");
                    oODataModel.resetChanges();
                },

                /**
                 * "Create new product button press event handler.
                 */
                onCreateProductPress: function () {
                    var sMessage;
                    if (
                        this.oMessageManager.getMessageModel().getProperty("/")
                            .length ||
                        !this._isFilledForm() ||
                        !this._isChosenStatus()
                    ) {
                        sMessage = this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("MessageValidInfo");
                        MessageBox.error(sMessage);
                    } else {
                        var oODataModel = this.getView().getModel("odata");
                        oODataModel.submitChanges();
                        this.onCancelPress();
                        sMessage = this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("MessageSuccessfulCreateProduct");
                        MessageToast.show(sMessage);
                    }
                },

                /**
                 * Applies changes after edition of product button press event handler.
                 */
                onEditProductPress: function () {
                    var sMessage;
                    if (
                        this.oMessageManager.getMessageModel().getProperty("/")
                            .length
                    ) {
                        sMessage = this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("MessageValidInfo");
                        MessageBox.error(sMessage);
                    } else {
                        var oODataModel = this.getView().getModel("odata");
                        oODataModel.submitChanges();
                        this.onCancelFromEditPress();
                    }
                },

                /**
                 * Delete current product button press event handler
                 *
                 * @param {sap.ui.base.Event} oEvent event object
                 */
                onDeleteProduct: function (oEvent) {
                    var oSelectedListItem = oEvent.getSource();
                    var oCtx = oSelectedListItem.getBindingContext("odata");
                    var oProductID = oCtx.getObject("id");
                    var sKey = `/Products(${oProductID})`;
                    var sMessage = this.getView()
                        .getModel("i18n")
                        .getResourceBundle()
                        .getText("ConfirmDeleteProduct");
                    MessageBox.confirm(sMessage, {
                        initialFocus: sap.m.MessageBox.Action.CANCEL,
                        onClose: function (sButton) {
                            if (sButton === MessageBox.Action.OK) {
                                var oODataModel =
                                    this.getView().getModel("odata");
                                oODataModel.remove(sKey, {
                                    success: function () {
                                        var sMessage = this.getView()
                                            .getModel("i18n")
                                            .getResourceBundle()
                                            .getText(
                                                "MessageSuccessfulDeleteProduct"
                                            );
                                        MessageToast.show(sMessage);
                                    }.bind(this),
                                    error: function () {
                                        var sMessage = this.getView()
                                            .getModel("i18n")
                                            .getResourceBundle()
                                            .getText(
                                                "MessageErrorDeletingProduct"
                                            );
                                        MessageBox.error(sMessage);
                                    },
                                });
                            }
                        }.bind(this),
                    });
                },

                /**
                 * Check all inputs are filled
                 *
                 * @returns {Boolean}  false if even 1 input is empty
                 */
                _isFilledForm: function () {
                    var oSimpleForm = this.getView().byId(
                        "idFormCreateOrEditProduct"
                    );
                    var content = oSimpleForm.getContent();
                    for (var i in content) {
                        var control = content[i];
                        if (control.getValue && control.getVisible() === true) {
                            if (control.getValue() === "") {
                                return false;
                            }
                        }
                    }
                    return true;
                },

                _isChosenStatus: function () {
                    var oStatusKey = this.getView()
                        .byId("idSelectStatus")
                        .getSelectedKey();
                    if (oStatusKey) {
                        return true;
                    } else {
                        return false;
                    }
                },
            }
        );
    }
);
