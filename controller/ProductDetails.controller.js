sap.ui.define(
    [
        "andrey/filimonov/controller/BaseController.controller",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox",
        "sap/m/MessageToast",
    ],
    function (
        BaseController,
        Filter,
        FilterOperator,
        MessageBox,
        MessageToast
    ) {
        "use strict";
        /**
         *Contain current store id
         */
        var sStoreID;

        /**
         *Contain current product id
         */
        var sProductID;

        return BaseController.extend(
            "andrey.filimonov.controller.ProductDetails",
            {
                /**
                 * Controller's "init" lifecycle method.
                 */
                onInit: function () {
                    this.myGetRouter()
                        .getRoute("ProductDetailsRoute")
                        .attachPatternMatched(this.onPatternMatched, this);
                },

                /**
                 * "ProductDetails" route pattern matched event handler. Get id of current store and product. Filter comments for current product
                 *
                 * @param {sap.ui.base.Event} oEvent event object.
                 */
                onPatternMatched: function (oEvent) {
                    var oCommentsList = this.byId("idListComments");
                    var mRouteArguments = oEvent.getParameter("arguments");
                    sStoreID = mRouteArguments.StoreID;
                    sProductID = mRouteArguments.ProductID;
                    var oODataModel = this.getView().getModel("odata");
                    oODataModel.metadataLoaded().then(() => {
                        var sKey = oODataModel.createKey("/Products", {
                            id: sProductID,
                        });
                        this.getView().bindObject({
                            path: sKey,
                            model: "odata",
                        });
                        var oItemsBinding = oCommentsList.getBinding("items");
                        var oFilter = new Filter(
                            "ProductId",
                            FilterOperator.EQ,
                            sProductID
                        );
                        oItemsBinding.filter(oFilter);
                    });
                },

                /**
                 * Go to "StoresOverview" page.
                 */
                goToStoreOverview: function () {
                    this.myGetRouter().navTo("StoresOverview");
                },

                /**
                 * Go to "StoreDetails" page.
                 */
                goToStoreDeteils: function () {
                    this.myGetRouter().navTo("StoreDetailsRoute", {
                        StoreID: sStoreID,
                    });
                },

                /**
                 * Return type of status indicator based on status of product in stock
                 *
                 * @param {String} sStatus current status in stock
                 * @returns {String} type of status indicator
                 */
                statusIndicator: function (sStatus) {
                    switch (sStatus) {
                        case "OK":
                            return "Success";
                        case "STORAGE":
                            return "Warning";
                        case "OUT_OF_STOCK":
                            return "Error";
                    }
                },

                /**
                 * Get the status name based on current page language
                 *
                 * @param {String} sStatus
                 * @returns {String} translateble name of product status
                 */
                statusTranslateble: function (sStatus) {
                    switch (sStatus) {
                        case "OK":
                            return this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("FilterOK");
                        case "STORAGE":
                            return this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("FilterStorage");
                        case "OUT_OF_STOCK":
                            return this.getView()
                                .getModel("i18n")
                                .getResourceBundle()
                                .getText("FilterOutOfStock");
                    }
                },

                /**
                 * Post comment from input form
                 */
                onPostComment: function () {
                    var sDate = new Date();
                    var oODataModel = this.getView().getModel("odata");
                    var Author = this.getView().byId("idAuthor").getValue();
                    var Rating = this.getView().byId("idRating").getValue();
                    var Message = this.getView().byId("idMessage").getValue();
                    if (Author === "") {
                        let sMessage = this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("MessageValidAuthor");
                        MessageBox.error(sMessage);
                    } else {
                        var oODataModel = this.getView().getModel("odata");
                        var oEntryCtx = oODataModel.createEntry(
                            "/ProductComments",
                            {
                                properties: {
                                    ProductId: sProductID,
                                    Author: Author,
                                    Rating: Rating,
                                    Message: Message,
                                    Posted: sDate,
                                },
                            }
                        );
                        oODataModel.submitChanges();
                        this.getView().byId("idAuthor").setValue("");
                        this.getView().byId("idRating").setValue(0);
                        let sMessage = this.getView()
                            .getModel("i18n")
                            .getResourceBundle()
                            .getText("MessageSuccessfulCreateComment");
                        MessageToast.show(sMessage);
                    }
                },
            }
        );
    }
);
