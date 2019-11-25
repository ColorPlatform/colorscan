import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FundingCycless } from '/imports/api/fundingcycles/fundingcycles.js';
import { Proposals } from '/imports/api/proposals/proposals.js';
import List from './List.jsx';

export default FundingCycleListContainer = withTracker((props) => {
    let FundingCyclesHandle, fundingCycles, fundingCyclesExist,proposalsHandle, proposals, proposalsExist;
    let loading = true;

    if (Meteor.isClient){
        FundingCyclesHandle = Meteor.subscribe('fundingcycles.list');
        proposalsHandle = Meteor.subscribe('proposals.list');
        loading = !FundingCyclesHandle.ready() || !proposalsHandle.ready();
    }

    if (Meteor.isServer || !loading){
        fundingCycles = FundingCycless.find({}, {sort:{cycleId:-1}}).fetch();
        proposals = Proposals.find({}, {sort:{proposalId:-1}}).fetch();

        if (Meteor.isServer){
            loading = false;
            fundingCyclesExist = !!fundingCycles;
            proposalsExist = !!proposals;
        }
        else{
            fundingCyclesExist = !loading && !!fundingCycles;
            proposalsExist = !loading && !!proposals;
        }
    }

    return {
        loading,
        fundingCyclesExist,
        fundingCycles: fundingCyclesExist ? fundingCycles : {},
        proposalsExist,
        proposals: proposalsExist ? proposals : {}
    };
})(List);
