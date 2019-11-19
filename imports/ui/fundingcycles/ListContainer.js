import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FundingCycless } from '/imports/api/fundingcycles/fundingcycles.js';
import List from './List.jsx';

export default FundingCycleListContainer = withTracker((props) => {
    let FundingCyclesHandle, fundingCycles, fundingCyclesExist;
    let loading = true;

    if (Meteor.isClient){
        FundingCyclesHandle = Meteor.subscribe('fundingcycles.list');
        loading = !FundingCyclesHandle.ready();
    }

    if (Meteor.isServer || !loading){
        fundingCycles = FundingCycless.find({}, {sort:{cycleId:-1}}).fetch();

        if (Meteor.isServer){
            loading = false;
            fundingCyclesExist = !!fundingCycles;
        }
        else{
            fundingCyclesExist = !loading && !!fundingCycles;
        }
    }

    return {
        loading,
        fundingCyclesExist,
        fundingCycles: fundingCyclesExist ? fundingCycles : {}
    };
})(List);
