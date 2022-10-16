sap.ui.define(
    [
        "andrey/filimonov/controller/BaseController.controller",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageToast",
        "sap/m/MessageBox",
    ],
    function (
        BaseController,
        Filter,
        FilterOperator,
        MessageToast,
        MessageBox
    ) {
        "use strict";

        return BaseController.extend(
            "andrey.filimonov.controller.StoresOverview",
            {
                /**
                 * Controller's "init" lifecycle method.
                 */
                onInit: function () {
                    var oMessageManager = sap.ui.getCore().getMessageManager();
                    this.oMessageManager = oMessageManager;
                    oMessageManager.registerObject(this.getView(), true);
                },

                /**
       *Store list line select event handler.

       * @param {sap.ui.base.Event} oEvent event object
       */
                onStoreItemSelect: function (oEvent) {
                    var oSource = oEvent.getSource();
                    var oCtx = oSource.getBindingContext("odata");
                    this.myGetRouter().navTo("StoreDetailsRoute", {
                        StoreID: oCtx.getObject("id"),
                    });
                },

                /**
                 * Searching among stores list event handler.
                 *
                 * @param {sap.ui.base.Event} oEvent event object
                 */
                onStoresSearch: function (oEvent) {
                    var oListStores = this.byId("idListStores");
                    var oItemsBinding = oListStores.getBinding("items");
                    var sQuery = oEvent.getParameter("query");
                    var oFilter = new Filter({
                        filters: [
                            new Filter({
                                path: "Name",
                                operator: FilterOperator.Contains,
                                value1: sQuery,
                            }),
                            new Filter({
                                path: "Address",
                                operator: FilterOperator.Contains,
                                value1: sQuery,
                            }),
                        ],
                        and: false,
                    });
                    oItemsBinding.filter(oFilter);
                },

                /**
                 *Open dialog creating new store button press event handler
                 */
                openDialogCreateStore: function () {
                    var oPromiseDialog;
                    if (!this.oDialog) {
                        oPromiseDialog = this.loadFragment({
                            name: "andrey.filimonov.view.fragments.CreateStoreDialog",
                        }).then((oDialog) => {
                            this.oDialog = oDialog;
                        });
                    } else {
                        oPromiseDialog = Promise.resolve();
                    }
                    oPromiseDialog.then(() => {
                        var oODataModel = this.getView().getModel("odata");
                        var oEntryCtx = oODataModel.createEntry("/Stores", {});
                        this.oDialog.setBindingContext(oEntryCtx);
                        this.oDialog.setModel(oODataModel);
                        this.oDialog.open();
                    });
                },

                /**
                 * "Cancel button press event handler (in the dialog).
                 */
                onCancelPress: function () {
                    this.oMessageManager.removeAllMessages();
                    var oODataModel = this.getView().getModel("odata");
                    var oCtx = this.oDialog.getBindingContext();
                    oODataModel.deleteCreatedEntry(oCtx);
                    this.oDialog.close();
                },

                /**
                 * "Create new store button press event handler.
                 */
                onCreateStorePress: function () {
                    var sMessage;

                    if (
                        this.oMessageManager.getMessageModel().getProperty("/")
                            .length ||
                        !this.isFilledForm()
                    ) {
                        sMessage = this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("MessageValidInfo");
                        MessageBox.error(sMessage);
                    } else {
                        if (this.isValidEmail()) {
                            sMessage = this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("MessageSuccessfulCreateStore");
                            var oODataModel = this.getView().getModel("odata");
                            oODataModel.submitChanges();
                            this.onCancelPress();
                            MessageToast.show(sMessage);
                        } else {
                            sMessage = this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("MessageValidEmail");
                            MessageBox.error(sMessage);
                        }
                    }
                },

                /**
                 * Check all inputs are filled
                 *
                 * @returns {Boolean}  false if even 1 input is empty
                 */
                isFilledForm: function () {
                    var oSimpleForm = this.getView().byId(
                        "idDialogCreateStore"
                    );
                    var content = oSimpleForm.getContent();
                    for (var i in content) {
                        var control = content[i];
                        if (control.getValue) {
                            if (control.getValue() === "") {
                                return false;
                            }
                        }
                    }
                    return true;
                },

                /**
                 * Validate email
                 *
                 * @returns {Boolean}  true if email is correct
                 */
                isValidEmail: function () {
                    let email = this.getView().byId("idInputEmail").getValue();
                    let regExpEmail =
                        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
                    if (!regExpEmail.test(String(email).toLowerCase())) {
                        return false;
                    } else {
                        return true;
                    }
                },
            }
        );
    }
);
