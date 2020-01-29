import { Meteor } from "meteor/meteor";
import { withTracker } from "meteor/react-meteor-data";
import { Validators } from "/imports/api/validators/validators.js";
import { Chain } from "/imports/api/chain/chain.js";
import LeaguesList from "./LeaguesList.jsx";

export default ValidatorListContainer = withTracker(props => {
  let validatorsHandle;
  let chainHandle;
  let loading = true;

  if (Meteor.isClient) {
    validatorsHandle = Meteor.subscribe("validators.all");
    chainHandle = Meteor.subscribe("chain.status");
    loading = !validatorsHandle.ready() && !chainHandle.ready();
  }
  let validatorsCond = {};
  if (props.inactive) {
    validatorsCond = {
      $or: [{ status: { $lt: 2 } }, { jailed: true }]
    };
  } else {
    validatorsCond = {
      jailed: false,
      status: 2
    };
  }

  let options = {};

  switch (props.priority) {
    case 0:
      options = {
        sort: {
          // "description.moniker": props.monikerDir,
          // league: props.leagueDir,
          league: props.noOfValidatorsDir
          // voting_power: props.votingPowerDir
        }
      };
      break;
    case 1:
      options = {
        sort: {
          // league: props.leagueDir,
          league: props.noOfValidatorsDir
          // voting_power: props.votingPowerDir,
          // "description.moniker": props.monikerDir
        }
      };
      break;
  }

  let validators;
  let chainStatus;
  let validatorsExist;

  if (Meteor.isServer || !loading) {
    validators = Validators.find(validatorsCond, options).fetch();
    chainStatus = Chain.findOne({ chainId: Meteor.settings.public.chainId });

    if (Meteor.isServer) {
      // loading = false;
      validatorsExist = !!validators && !!chainStatus;
    } else {
      validatorsExist = !loading && !!validators && !!chainStatus;
    }
  }
  return {
    loading,
    validatorsExist,
    validators: validatorsExist ? validators : {},
    chainStatus: validatorsExist ? chainStatus : {}
  };
})(LeaguesList);
