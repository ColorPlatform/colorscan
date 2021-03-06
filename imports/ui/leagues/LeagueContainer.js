import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Validators } from '/imports/api/validators/validators.js';
import { Chain } from '/imports/api/chain/chain.js';
import League from './League.jsx';

export default ValidatorListContainer = withTracker((props) => {
    let validatorsHandle;
    let chainHandle;
    let loading = true;

    if (Meteor.isClient){
        validatorsHandle = Meteor.subscribe('validators.all');
        chainHandle = Meteor.subscribe('chain.status');
        loading = !validatorsHandle.ready() && !chainHandle.ready();    
    }
    let validatorsCond = {};
    if (props.inactive){
        validatorsCond = {
            $or: [
                { status: { $lt : 2 } },
                { jailed: true }
            ]
        }
    }
    else{
        validatorsCond = {
            jailed: false,
            status: 2
        }
    }

    let options = {};

    switch(props.priority){
    case 0:
        options = {
            sort:{
                "description.moniker": props.monikerDir,
                "commission.rate": props.commissionDir,
                "league": props.leagueDir,
                uptime: props.uptimeDir,
                voting_power: props.votingPowerDir,
                self_delegation: props.selfDelDir
            }
        }
        break;
    case 1:
        options = {
            sort:{
                "league": props.leagueDir,
                voting_power: props.votingPowerDir,
                "description.moniker": props.monikerDir,
                uptime: props.uptimeDir,
                "commission.rate": props.commissionDir,
                self_delegation: props.selfDelDir
            }
        }
        break;
    case 2:
        options = {
            sort:{
                voting_power: props.votingPowerDir,
                "description.moniker": props.monikerDir,
                "league": props.leagueDir,
                uptime: props.uptimeDir,
                "commission.rate": props.commissionDir,
                self_delegation: props.selfDelDir
            }
        }
        break;
    case 3:
        options = {
            sort:{
                uptime: props.uptimeDir,
                "description.moniker": props.monikerDir,
                "league": props.leagueDir,
                voting_power: props.votingPowerDir,
                "commission.rate": props.commissionDir,
                self_delegation: props.selfDelDir,
            }
        }
        break;
    case 4:
        options = {
            sort:{
                "commission.rate": props.commissionDir,
                "description.moniker": props.monikerDir,
                "league": props.leagueDir,
                voting_power: props.votingPowerDir,
                uptime: props.uptimeDir,
                self_delegation: props.selfDelDir
            }
        }
        break;
    case 5:
        options = {
            sort:{
                self_delegation: props.selfDelDir,
                "description.moniker": props.monikerDir,
                "league": props.leagueDir,
                "commission.rate": props.commissionDir,
                voting_power: props.votingPowerDir,
                uptime: props.uptimeDir,
            }
        }
        break;
    case 6:
        options = {
            sort:{
                status: props.statusDir,
                jailed: props.jailedDir,
                "description.moniker": props.monikerDir,
                "league": props.leagueDir,
            }
        }
        break;
    case 7:
        options = {
            sort:{
                jailed: props.jailedDir,
                status: props.statusDir,
                "description.moniker": props.monikerDir,
                "league": props.leagueDir,
            }
        }
        break;
    }

    let validators;
    let chainStatus;
    let validatorsExist;

    if (Meteor.isServer || !loading){
        validators = Validators.find(validatorsCond,options).fetch();
        chainStatus = Chain.findOne({chainId:Meteor.settings.public.chainId});

        if (Meteor.isServer){
            // loading = false;
            validatorsExist = !!validators && !!chainStatus;
        }
        else{
            validatorsExist = !loading && !!validators && !!chainStatus;
        }
        
    }
    return {
        loading,
        validatorsExist,
        validators: validatorsExist ? validators : {},
        chainStatus: validatorsExist ? chainStatus : {}
    };
})(League);
