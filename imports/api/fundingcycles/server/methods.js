import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { FundingCycless } from '../fundingcycles.js';

Meteor.methods({
    'FundingCycles.getFundingCycles': function(){
        this.unblock();
        try{
            let url = LCD + '/gov/fundingcycles';
            let response = HTTP.get(url);
            let FundingCycles = JSON.parse(response.content);

            // console.log(FundingCycles);

            let FundingCycleIds = [];
            if (FundingCycles.length > 0){
                // FundingCycles.upsert()
                const bulkFundingCycles = FundingCycless.rawCollection().initializeUnorderedBulkOp();
                for (let i in FundingCycles){
                    let FundingCycle = FundingCycles[i];
                    FundingCycle.cycleId = parseInt(FundingCycle.cycle_id);
                    if (FundingCycle.cycleId >= 0){
                        try{
                            let url = LCD + '/gov/fundingcycles/'+FundingCycle.cycleId;
                            let response = HTTP.get(url);
                            if (response.statusCode == 200){
                                let proposer = JSON.parse(response.content);
                                if (proposer.cycle_id && (proposer.cycle_id == FundingCycle.cycle_id)){
                                    FundingCycle.proposer = proposer.proposer;
                                }
                            }
                            bulkFundingCycles.find({cycleId: FundingCycle.cycleId}).upsert().updateOne({$set:FundingCycle});
                            FundingCycleIds.push(FundingCycle.cycleId);
                        }
                        catch(e){
                            bulkFundingCycles.find({cycleId: FundingCycle.cycleId}).upsert().updateOne({$set:FundingCycle});
                            FundingCycleIds.push(FundingCycle.cycleId);
                            console.log(e.response.content);
                        }
                    }
                }
                // bulkFundingCycles.find({cycleId:{$nin:FundingCycleIds}}).update({$set:{"value.proposal_status":"Removed"}});
                bulkFundingCycles.execute();
            }
        }
        catch (e){
            console.log(e);
        }
    },
})