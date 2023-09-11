sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
],
    /**
     *  @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,
        Filter, MessageBox, MessageToast) {
        "use strict";

        return Controller.extend("com.yokogawa.zhfi0002.controller.App", {
            onInit: function () {

            },
            onClear:function(){
                this.getOwnerComponent().getModel("ui").setData({});
            },
            onSearch: function () {
                var that = this;
                var data = this.byId("smartFilterBar").getFilterData();
                if(!data.CompanyCode || !data.FisYear || !data.DocNo){
                    MessageBox.error("Please fill all mandatory parameters");
                    return;
                }
                var aCompanyCode = [];
                data.CompanyCode.items.forEach(element => {
                    aCompanyCode.push(new Filter("CompanyCode","EQ",element.key));
                });
                var fCompanyFilter = new Filter({
                    filters:aCompanyCode,
                    and:false
                });
                
                var aFisYear = [];
                data.FisYear.ranges.forEach(element => {
                    aFisYear.push(new Filter("FisYear",element.operation,element.value1));
                });
                var fFisYearFilter = new Filter({
                    filters:aFisYear,
                    and:false
                });
                
                var aDocNo = [];
                data.DocNo.ranges.forEach(element => {
                    aDocNo.push(new Filter("DocNo",element.operation,element.value1));
                });
                var fDocNoFilter = new Filter({
                    filters:aDocNo,
                    and:false
                });
                // data.CompanyCode = data.CompanyCode.items[0].key;
                // data.FisYear = data.FisYear.ranges[0].value1;
                // data.DocNo = data.DocNo.ranges[0].value1;
                sap.ui.core.BusyIndicator.show(0);
                that.getOwnerComponent().getModel().read("/DebitNote", {
                    filters: [new Filter({
                        filters:[fCompanyFilter,fFisYearFilter,fDocNoFilter],
                        and:true
                    })],
                    success: function (res) {
                        sap.ui.core.BusyIndicator.hide();
                        if(res.results.length === 0){
                            MessageBox.error("No Records Found.");
                            return;
                        }
                        // if(res.results[0].MSGTP === "E"){
                        //     MessageBox.error(res.results[0].MSGTX);
                        //     return;
                        // }else{
                        //     MessageBox.success(res.results[0].MSGTX);
                        // }
                        var errorCount = 0;
                        var successCount = 0;
                        res.results.forEach(element => {
                            if(element.MSGTP === "E"){
                                errorCount++;
                            }
                            if(element.MSGTP === "S"){
                                successCount++;
                            }
                            if(element.PDF){
                                var decodedPdfContent = atob(element.PDF);
                                var byteArray = new Uint8Array(decodedPdfContent.length);
                                for (var i = 0; i < decodedPdfContent.length; i++) {
                                    byteArray[i] = decodedPdfContent.charCodeAt(i);
                                }
                                var blob = new Blob([byteArray.buffer], {
                                    type: 'application/pdf'
                                });
                                var _pdfurl = URL.createObjectURL(blob);
                                var link = document.createElement('a');
                                link.href = _pdfurl;
                                link.download = element.DocNo + "_" + element.FisYear + "_" + element.CompanyCode + '.pdf';
                                link.dispatchEvent(new MouseEvent('click'));
                            }                            
                        });
                        if(errorCount > 0){
                            that.getOwnerComponent().getModel("ui").setProperty("/responseType", "Error");
                            that.getOwnerComponent().getModel("ui").setProperty("/ProductCollection", res.results);
                        }
                        that.getOwnerComponent().getModel("ui").setProperty("/responseText", 
                        "Number of records : " + res.results.length + ",   Successful record count : " + successCount + ",   Error record count : " + errorCount + "");
                        
                        // MessageToast.show("File donwloaded successfully");
                    },
                    error: function () {
                        sap.ui.core.BusyIndicator.hide();
                    }
                });
            }
        });
    });
