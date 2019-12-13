var require = meteorInstall({"imports":{"api":{"accounts":{"server":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/accounts/server/methods.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let HTTP;
module.link("meteor/http", {
  HTTP(v) {
    HTTP = v;
  }

}, 1);
Meteor.methods({
  'accounts.getBalance': function (address) {
    this.unblock();
    let balance = {}; // get available color

    let url = LCD + '/bank/balances/' + address;

    try {
      let available = HTTP.get(url);

      if (available.statusCode == 200) {
        // console.log(JSON.parse(available.content))
        balance.available = JSON.parse(available.content);
        if (balance.available && balance.available.length > 0) balance.available = balance.available[0];
      }
    } catch (e) {
      console.log(e);
    } // get delegated amnounts


    url = LCD + '/staking/delegators/' + address + '/delegations';

    try {
      let delegations = HTTP.get(url);

      if (delegations.statusCode == 200) {
        balance.delegations = JSON.parse(delegations.content);
      }
    } catch (e) {
      console.log(e);
    } // get unbonding


    url = LCD + '/staking/delegators/' + address + '/unbonding_delegations';

    try {
      let unbonding = HTTP.get(url);

      if (unbonding.statusCode == 200) {
        balance.unbonding = JSON.parse(unbonding.content);
      }
    } catch (e) {
      console.log(e);
    } // get rewards


    url = LCD + '/distribution/delegators/' + address + '/rewards';

    try {
      let rewards = HTTP.get(url);

      if (rewards.statusCode == 200) {
        balance.rewards = JSON.parse(rewards.content);
      }
    } catch (e) {
      console.log(e);
    }

    return balance;
  },

  'accounts.getAllDelegations'(address) {
    let url = LCD + '/staking/delegators/' + address + '/delegations';

    try {
      let delegations = HTTP.get(url);

      if (delegations.statusCode == 200) {
        delegations = JSON.parse(delegations.content);

        if (delegations && delegations.length > 0) {
          delegations.forEach((delegation, i) => {
            if (delegations[i] && delegations[i].shares) delegations[i].shares = parseFloat(delegations[i].shares);
          });
        }

        return delegations;
      }

      ;
    } catch (e) {
      console.log(e);
    }
  },

  'accounts.getAllUnbondings'(address) {
    let url = LCD + '/staking/delegators/' + address + '/unbonding_delegations';

    try {
      let unbondings = HTTP.get(url);

      if (unbondings.statusCode == 200) {
        unbondings = JSON.parse(unbondings.content);
        return unbondings;
      }

      ;
    } catch (e) {
      console.log(e);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"blocks":{"server":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/blocks/server/methods.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let HTTP;
module.link("meteor/http", {
  HTTP(v) {
    HTTP = v;
  }

}, 1);
let Promise;
module.link("meteor/promise", {
  Promise(v) {
    Promise = v;
  }

}, 2);
let Blockscon;
module.link("/imports/api/blocks/blocks.js", {
  Blockscon(v) {
    Blockscon = v;
  }

}, 3);
let Chain;
module.link("/imports/api/chain/chain.js", {
  Chain(v) {
    Chain = v;
  }

}, 4);
let ValidatorSets;
module.link("/imports/api/validator-sets/validator-sets.js", {
  ValidatorSets(v) {
    ValidatorSets = v;
  }

}, 5);
let Validators;
module.link("/imports/api/validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 6);
let ValidatorRecords, Analytics, VPDistributions;
module.link("/imports/api/records/records.js", {
  ValidatorRecords(v) {
    ValidatorRecords = v;
  },

  Analytics(v) {
    Analytics = v;
  },

  VPDistributions(v) {
    VPDistributions = v;
  }

}, 7);
let VotingPowerHistory;
module.link("/imports/api/voting-power/history.js", {
  VotingPowerHistory(v) {
    VotingPowerHistory = v;
  }

}, 8);
let Transactions;
module.link("../../transactions/transactions.js", {
  Transactions(v) {
    Transactions = v;
  }

}, 9);
let Evidences;
module.link("../../evidences/evidences.js", {
  Evidences(v) {
    Evidences = v;
  }

}, 10);
let sha256;
module.link("js-sha256", {
  sha256(v) {
    sha256 = v;
  }

}, 11);
let getAddress;
module.link("tendermint/lib/pubkey", {
  getAddress(v) {
    getAddress = v;
  }

}, 12);

// import Block from '../../../ui/components/Block';
// getValidatorVotingPower = (validators, address) => {
//     for (v in validators){
//         if (validators[v].address == address){
//             return parseInt(validators[v].voting_power);
//         }
//     }
// }
getRemovedValidators = (prevValidators, validators) => {
  // let removeValidators = [];
  for (p in prevValidators) {
    for (v in validators) {
      if (prevValidators[p].address == validators[v].address) {
        prevValidators.splice(p, 1);
      }
    }
  }

  return prevValidators;
}; // var filtered = [1, 2, 3, 4, 5].filter(notContainedIn([1, 2, 3, 5]));
// console.log(filtered); // [4]


Meteor.methods({
  'blocks.averageBlockTime'(address) {
    let blocks = Blockscon.find({
      proposerAddress: address
    }).fetch();
    let heights = blocks.map((block, i) => {
      return block.height;
    });
    let blocksStats = Analytics.find({
      height: {
        $in: heights
      }
    }).fetch(); // console.log(blocksStats);

    let totalBlockDiff = 0;

    for (b in blocksStats) {
      totalBlockDiff += blocksStats[b].timeDiff;
    }

    return totalBlockDiff / heights.length;
  },

  'blocks.findUpTime'(address) {
    let collection = ValidatorRecords.rawCollection(); // let aggregateQuery = Meteor.wrapAsync(collection.aggregate, collection);

    var pipeline = [{
      $match: {
        "address": address
      }
    }, // {$project:{address:1,height:1,exists:1}},
    {
      $sort: {
        "height": -1
      }
    }, {
      $limit: Meteor.settings.public.uptimeWindow - 1
    }, {
      $unwind: "$_id"
    }, {
      $group: {
        "_id": "$address",
        "uptime": {
          "$sum": {
            $cond: [{
              $eq: ['$exists', true]
            }, 1, 0]
          }
        }
      }
    }]; // let result = aggregateQuery(pipeline, { cursor: {} });

    return Promise.await(collection.aggregate(pipeline).toArray()); // return .aggregate()
  },

  'blocks.getLatestHeight': function () {
    this.unblock();
    let url = RPC + '/status';

    try {
      let response = HTTP.get(url);
      let status = JSON.parse(response.content);
      return status.result.sync_info.latest_block_height;
    } catch (e) {
      return 0;
    }
  },
  'blocks.getCurrentHeight': function () {
    this.unblock();
    let currHeight = Blockscon.find({}, {
      sort: {
        height: -1
      },
      limit: 1
    }).fetch(); // console.log("currentHeight:"+currHeight);

    if (currHeight && currHeight.length == 1) return currHeight[0].height;else return Meteor.settings.params.startHeight;
  },
  'blocks.blocksUpdate': function () {
    if (SYNCING) return "Syncing...";else console.log("start to sync"); // Meteor.clearInterval(Meteor.timerHandle);
    // get the latest height

    let until = Meteor.call('blocks.getLatestHeight'); // console.log(until);
    // get the current height in db

    let curr = Meteor.call('blocks.getCurrentHeight');
    console.log(curr); // loop if there's update in db

    if (until > curr) {
      SYNCING = true;
      let validatorSet; // get latest validator candidate information

      url = LCD + '/staking/validators';

      try {
        response = HTTP.get(url);
        validatorSet = JSON.parse(response.content);
      } catch (e) {
        console.log(e);
      }

      url = LCD + '/staking/validators?status=unbonding';

      try {
        response = HTTP.get(url);
        [...validatorSet] = [...validatorSet, ...JSON.parse(response.content)];
      } catch (e) {
        console.log(e);
      }

      url = LCD + '/staking/validators?status=unbonded';

      try {
        response = HTTP.get(url);
        [...validatorSet] = [...validatorSet, ...JSON.parse(response.content)];
      } catch (e) {
        console.log(e);
      }

      console.log("all validators: " + validatorSet.length);

      for (let height = curr + 1; height <= until; height++) {
        let startBlockTime = new Date(); // add timeout here? and outside this loop (for catched up and keep fetching)?

        this.unblock();
        let url = RPC + '/block?height=' + height;
        let analyticsData = {};
        console.log(url);

        try {
          const bulkValidators = Validators.rawCollection().initializeUnorderedBulkOp();
          const bulkValidatorRecords = ValidatorRecords.rawCollection().initializeUnorderedBulkOp();
          const bulkVPHistory = VotingPowerHistory.rawCollection().initializeUnorderedBulkOp();
          const bulkTransations = Transactions.rawCollection().initializeUnorderedBulkOp();
          let startGetHeightTime = new Date();
          let response = HTTP.get(url);

          if (response.statusCode == 200) {
            let block = JSON.parse(response.content);
            block = block.result; // store height, hash, numtransaction and time in db

            let blockData = {};
            blockData.height = height;
            blockData.hash = block.block_meta.block_id.hash;
            blockData.transNum = block.block_meta.header.num_txs;
            blockData.time = new Date(block.block.header.time);
            blockData.lastBlockHash = block.block.header.last_block_id.hash;
            blockData.proposerAddress = block.block.header.proposer_address;
            blockData.validators = [];
            let precommits = block.block.last_commit.precommits;

            if (precommits != null) {
              // console.log(precommits.length);
              for (let i = 0; i < precommits.length; i++) {
                if (precommits[i] != null) {
                  blockData.validators.push(precommits[i].validator_address);
                }
              }

              analyticsData.precommits = precommits.length; // record for analytics
              // PrecommitRecords.insert({height:height, precommits:precommits.length});
            } // save txs in database


            if (block.block.data.txs && block.block.data.txs.length > 0) {
              for (t in block.block.data.txs) {
                Meteor.call('Transactions.index', sha256(Buffer.from(block.block.data.txs[t], 'base64')), blockData.time, (err, result) => {
                  if (err) {
                    console.log(err);
                  }
                });
              }
            } // save double sign evidences


            if (block.block.evidence.evidence) {
              Evidences.insert({
                height: height,
                evidence: block.block.evidence.evidence
              });
            }

            blockData.precommitsCount = blockData.validators.length;
            analyticsData.height = height;
            let endGetHeightTime = new Date();
            console.log("Get height time: " + (endGetHeightTime - startGetHeightTime) / 1000 + "seconds.");
            let startGetValidatorsTime = new Date(); // update chain status

            url = RPC + '/validators?height=' + height;
            response = HTTP.get(url);
            console.log(url);
            let validators = JSON.parse(response.content);
            validators.result.block_height = parseInt(validators.result.block_height);
            ValidatorSets.insert(validators.result);
            blockData.validatorsCount = validators.result.validators.length;
            let startBlockInsertTime = new Date();
            Blockscon.insert(blockData);
            let endBlockInsertTime = new Date();
            console.log("Block insert time: " + (endBlockInsertTime - startBlockInsertTime) / 1000 + "seconds."); // store valdiators exist records

            let existingValidators = Validators.find({
              address: {
                $exists: true
              }
            }).fetch();

            if (height > 1) {
              // record precommits and calculate uptime
              // only record from block 2
              for (i in validators.result.validators) {
                let address = validators.result.validators[i].address;
                let record = {
                  height: height,
                  address: address,
                  exists: false,
                  voting_power: parseInt(validators.result.validators[i].voting_power) //getValidatorVotingPower(existingValidators, address)

                };

                for (j in precommits) {
                  if (precommits[j] != null) {
                    if (address == precommits[j].validator_address) {
                      record.exists = true;
                      precommits.splice(j, 1);
                      break;
                    }
                  }
                } // calculate the uptime based on the records stored in previous blocks
                // only do this every 15 blocks ~


                if (height % 15 == 0) {
                  // let startAggTime = new Date();
                  let numBlocks = Meteor.call('blocks.findUpTime', address);
                  let uptime = 0; // let endAggTime = new Date();
                  // console.log("Get aggregated uptime for "+existingValidators[i].address+": "+((endAggTime-startAggTime)/1000)+"seconds.");

                  if (numBlocks[0] != null && numBlocks[0].uptime != null) {
                    uptime = numBlocks[0].uptime;
                  }

                  let base = Meteor.settings.public.uptimeWindow;

                  if (height < base) {
                    base = height;
                  }

                  if (record.exists) {
                    if (uptime < base) {
                      uptime++;
                    }

                    uptime = uptime / base * 100;
                    bulkValidators.find({
                      address: address
                    }).upsert().updateOne({
                      $set: {
                        uptime: uptime,
                        lastSeen: blockData.time
                      }
                    });
                  } else {
                    uptime = uptime / base * 100;
                    bulkValidators.find({
                      address: address
                    }).upsert().updateOne({
                      $set: {
                        uptime: uptime
                      }
                    });
                  }
                }

                bulkValidatorRecords.insert(record); // ValidatorRecords.update({height:height,address:record.address},record);
              }
            }

            let chainStatus = Chain.findOne({
              chainId: block.block_meta.header.chain_id
            });
            let lastSyncedTime = chainStatus ? chainStatus.lastSyncedTime : 0;
            let timeDiff;
            let blockTime = Meteor.settings.params.defaultBlockTime;

            if (lastSyncedTime) {
              let dateLatest = blockData.time;
              let dateLast = new Date(lastSyncedTime);
              timeDiff = Math.abs(dateLatest.getTime() - dateLast.getTime()); //blockTime = (chainStatus.blockTime * (blockData.height - 1) + timeDiff) / blockData.height;

              if (timeDiff < chainStatus.blockTime) {
                blockTime = timeDiff;
              } else {
                blockTime = chainStatus.blockTime;
              }
            }

            let endGetValidatorsTime = new Date();
            console.log("Get height validators time: " + (endGetValidatorsTime - startGetValidatorsTime) / 1000 + "seconds.");
            Chain.update({
              chainId: block.block_meta.header.chain_id
            }, {
              $set: {
                lastSyncedTime: blockData.time,
                blockTime: blockTime
              }
            });
            analyticsData.averageBlockTime = blockTime;
            analyticsData.timeDiff = timeDiff;
            analyticsData.time = blockData.time; // initialize validator data at first block
            // if (height == 1){
            //     Validators.remove({});
            // }

            analyticsData.voting_power = 0; // validators are all the validators in the current height

            console.log("validatorSet.length: " + validatorSet.length);
            let startFindValidatorsNameTime = new Date();

            if (validators.result) {
              for (v in validators.result.validators) {
                // Validators.insert(validators.result.validators[v]);
                let validator = validators.result.validators[v];
                validator.voting_power = parseInt(validator.voting_power);
                validator.proposer_priority = parseInt(validator.proposer_priority);
                let valExist = Validators.findOne({
                  "pub_key.value": validator.pub_key.value
                });

                if (!valExist) {
                  console.log("validator pub_key not in db"); // let command = Meteor.settings.bin.gaiadebug+" pubkey "+validator.pub_key.value;
                  // console.log(command);
                  // let tempVal = validator;

                  validator.address = getAddress(validator.pub_key);
                  validator.accpub = Meteor.call('pubkeyToBech32', validator.pub_key, Meteor.settings.public.bech32PrefixAccPub);
                  validator.operator_pubkey = Meteor.call('pubkeyToBech32', validator.pub_key, Meteor.settings.public.bech32PrefixValPub);
                  validator.consensus_pubkey = Meteor.call('pubkeyToBech32', validator.pub_key, Meteor.settings.public.bech32PrefixConsPub);

                  for (val in validatorSet) {
                    if (validatorSet[val].consensus_pubkey == validator.consensus_pubkey) {
                      validator.operator_address = validatorSet[val].operator_address;
                      validator.delegator_address = Meteor.call('getDelegator', validatorSet[val].operator_address);
                      validator.jailed = validatorSet[val].jailed;
                      validator.status = validatorSet[val].status;
                      validator.min_self_delegation = validatorSet[val].min_self_delegation;
                      validator.tokens = validatorSet[val].tokens;
                      validator.league = validatorSet[val].league;
                      validator.delegator_shares = validatorSet[val].delegator_shares;
                      validator.description = validatorSet[val].description;
                      validator.bond_height = validatorSet[val].bond_height;
                      validator.bond_intra_tx_counter = validatorSet[val].bond_intra_tx_counter;
                      validator.unbonding_height = validatorSet[val].unbonding_height;
                      validator.unbonding_time = validatorSet[val].unbonding_time;
                      validator.commission = validatorSet[val].commission;
                      validator.self_delegation = validator.delegator_shares; // validator.removed = false,
                      // validator.removedAt = 0
                      // validatorSet.splice(val, 1);

                      break;
                    }
                  } // bulkValidators.insert(validator);


                  bulkValidators.find({
                    consensus_pubkey: validator.consensus_pubkey
                  }).upsert().updateOne({
                    $set: validator
                  }); // console.log("validator first appears: "+bulkValidators.length);

                  bulkVPHistory.insert({
                    address: validator.address,
                    prev_voting_power: 0,
                    voting_power: validator.voting_power,
                    type: 'add',
                    height: blockData.height,
                    block_time: blockData.time
                  });
                } else {
                  for (val in validatorSet) {
                    if (validatorSet[val].consensus_pubkey == valExist.consensus_pubkey) {
                      validator.jailed = validatorSet[val].jailed;
                      validator.status = validatorSet[val].status;
                      validator.tokens = validatorSet[val].tokens;
                      validator.league = validatorSet[val].league;
                      validator.delegator_shares = validatorSet[val].delegator_shares;
                      validator.description = validatorSet[val].description;
                      validator.bond_height = validatorSet[val].bond_height;
                      validator.bond_intra_tx_counter = validatorSet[val].bond_intra_tx_counter;
                      validator.unbonding_height = validatorSet[val].unbonding_height;
                      validator.unbonding_time = validatorSet[val].unbonding_time;
                      validator.commission = validatorSet[val].commission; // calculate self delegation percentage every 30 blocks

                      if (height % 30 == 1) {
                        try {
                          let response = HTTP.get(LCD + '/staking/delegators/' + valExist.delegator_address + '/delegations/' + valExist.operator_address);

                          if (response.statusCode == 200) {
                            let selfDelegation = JSON.parse(response.content);

                            if (selfDelegation.shares) {
                              validator.self_delegation = parseFloat(selfDelegation.shares) / parseFloat(validator.delegator_shares);
                            }
                          }
                        } catch (e) {// console.log(e);
                        }
                      }

                      bulkValidators.find({
                        consensus_pubkey: valExist.consensus_pubkey
                      }).updateOne({
                        $set: validator
                      }); // console.log("validator exisits: "+bulkValidators.length);
                      // validatorSet.splice(val, 1);

                      break;
                    }
                  }

                  let prevVotingPower = VotingPowerHistory.findOne({
                    address: validator.address
                  }, {
                    height: -1,
                    limit: 1
                  });

                  if (prevVotingPower) {
                    if (prevVotingPower.voting_power != validator.voting_power) {
                      let changeType = prevVotingPower.voting_power > validator.voting_power ? 'down' : 'up';
                      let changeData = {
                        address: validator.address,
                        prev_voting_power: prevVotingPower.voting_power,
                        voting_power: validator.voting_power,
                        type: changeType,
                        height: blockData.height,
                        block_time: blockData.time
                      }; // console.log('voting power changed.');
                      // console.log(changeData);

                      bulkVPHistory.insert(changeData);
                    }
                  }
                } // console.log(validator);


                analyticsData.voting_power += validator.voting_power;
              } // if there is validator removed


              let prevValidators = ValidatorSets.findOne({
                block_height: height - 1
              });

              if (prevValidators) {
                let removedValidators = getRemovedValidators(prevValidators.validators, validators.result.validators);

                for (r in removedValidators) {
                  bulkVPHistory.insert({
                    address: removedValidators[r].address,
                    prev_voting_power: removedValidators[r].voting_power,
                    voting_power: 0,
                    type: 'remove',
                    height: blockData.height,
                    block_time: blockData.time
                  });
                }
              }
            }

            let endFindValidatorsNameTime = new Date();
            console.log("Get validators name time: " + (endFindValidatorsNameTime - startFindValidatorsNameTime) / 1000 + "seconds."); // record for analytics

            let startAnayticsInsertTime = new Date();
            Analytics.insert(analyticsData);
            let endAnalyticsInsertTime = new Date();
            console.log("Analytics insert time: " + (endAnalyticsInsertTime - startAnayticsInsertTime) / 1000 + "seconds.");
            let startVUpTime = new Date();

            if (bulkValidators.length > 0) {
              // console.log(bulkValidators.length);
              bulkValidators.execute((err, result) => {
                if (err) {
                  console.log(err);
                }

                if (result) {// console.log(result);
                }
              });
            }

            let endVUpTime = new Date();
            console.log("Validator update time: " + (endVUpTime - startVUpTime) / 1000 + "seconds.");
            let startVRTime = new Date();

            if (bulkValidatorRecords.length > 0) {
              bulkValidatorRecords.execute((err, result) => {
                if (err) {
                  console.log(err);
                }
              });
            }

            let endVRTime = new Date();
            console.log("Validator records update time: " + (endVRTime - startVRTime) / 1000 + "seconds.");

            if (bulkVPHistory.length > 0) {
              bulkVPHistory.execute((err, result) => {
                if (err) {
                  console.log(err);
                }
              });
            }

            if (bulkTransations.length > 0) {
              bulkTransations.execute((err, result) => {
                if (err) {
                  console.log(err);
                }
              });
            } // calculate voting power distribution every 60 blocks ~ 5mins


            if (height % 60 == 1) {
              console.log("===== calculate voting power distribution =====");
              let activeValidators = Validators.find({
                status: 2,
                jailed: false
              }, {
                sort: {
                  voting_power: -1
                }
              }).fetch();
              let numTopTwenty = Math.ceil(activeValidators.length * 0.2);
              let numBottomEighty = activeValidators.length - numTopTwenty;
              let topTwentyPower = 0;
              let bottomEightyPower = 0;
              let numTopThirtyFour = 0;
              let numBottomSixtySix = 0;
              let topThirtyFourPercent = 0;
              let bottomSixtySixPercent = 0;

              for (v in activeValidators) {
                if (v < numTopTwenty) {
                  topTwentyPower += activeValidators[v].voting_power;
                } else {
                  bottomEightyPower += activeValidators[v].voting_power;
                }

                if (topThirtyFourPercent < 0.34) {
                  topThirtyFourPercent += activeValidators[v].voting_power / analyticsData.voting_power;
                  numTopThirtyFour++;
                }
              }

              bottomSixtySixPercent = 1 - topThirtyFourPercent;
              numBottomSixtySix = activeValidators.length - numTopThirtyFour;
              let vpDist = {
                height: height,
                numTopTwenty: numTopTwenty,
                topTwentyPower: topTwentyPower,
                numBottomEighty: numBottomEighty,
                bottomEightyPower: bottomEightyPower,
                numTopThirtyFour: numTopThirtyFour,
                topThirtyFourPercent: topThirtyFourPercent,
                numBottomSixtySix: numBottomSixtySix,
                bottomSixtySixPercent: bottomSixtySixPercent,
                numValidators: activeValidators.length,
                totalVotingPower: analyticsData.voting_power,
                blockTime: blockData.time,
                createAt: new Date()
              };
              console.log(vpDist);
              VPDistributions.insert(vpDist);
            }
          }
        } catch (e) {
          console.log(e);
          SYNCING = false;
          return "Stopped";
        }

        let endBlockTime = new Date();
        console.log("This block used: " + (endBlockTime - startBlockTime) / 1000 + "seconds.");
      }

      SYNCING = false;
      Chain.update({
        chainId: Meteor.settings.public.chainId
      }, {
        $set: {
          lastBlocksSyncedTime: new Date(),
          totalValidators: validatorSet.length
        }
      });
    }

    return until;
  },
  'addLimit': function (limit) {
    // console.log(limit+10)
    return limit + 10;
  },
  'hasMore': function (limit) {
    if (limit > Meteor.call('getCurrentHeight')) {
      return false;
    } else {
      return true;
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/blocks/server/publications.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Blockscon;
module.link("../blocks.js", {
  Blockscon(v) {
    Blockscon = v;
  }

}, 1);
let Validators;
module.link("../../validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 2);
let Transactions;
module.link("../../transactions/transactions.js", {
  Transactions(v) {
    Transactions = v;
  }

}, 3);
publishComposite('blocks.height', function (limit) {
  return {
    find() {
      return Blockscon.find({}, {
        limit: limit,
        sort: {
          height: -1
        }
      });
    },

    children: [{
      find(block) {
        return Validators.find({
          address: block.proposerAddress
        }, {
          limit: 1
        });
      }

    }]
  };
});
publishComposite('blocks.findOne', function (height) {
  return {
    find() {
      return Blockscon.find({
        height: height
      });
    },

    children: [{
      find(block) {
        return Transactions.find({
          height: block.height
        });
      }

    }, {
      find(block) {
        return Validators.find({
          address: block.proposerAddress
        }, {
          limit: 1
        });
      }

    }]
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"blocks.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/blocks/blocks.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Blockscon: () => Blockscon
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let Validators;
module.link("../validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 1);
const Blockscon = new Mongo.Collection('blocks');
Blockscon.helpers({
  proposer() {
    return Validators.findOne({
      address: this.proposerAddress
    });
  }

}); // Blockscon.helpers({
//     sorted(limit) {
//         return Blockscon.find({}, {sort: {height:-1}, limit: limit});
//     }
// });
// Meteor.setInterval(function() {
//     Meteor.call('blocksUpdate', (error, result) => {
//         console.log(result);
//     })
// }, 30000000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"chain":{"server":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/chain/server/methods.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let HTTP;
module.link("meteor/http", {
  HTTP(v) {
    HTTP = v;
  }

}, 1);
let getAddress;
module.link("tendermint/lib/pubkey.js", {
  getAddress(v) {
    getAddress = v;
  }

}, 2);
let Chain, ChainStates;
module.link("../chain.js", {
  Chain(v) {
    Chain = v;
  },

  ChainStates(v) {
    ChainStates = v;
  }

}, 3);
let Validators;
module.link("../../validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 4);
let VotingPowerHistory;
module.link("../../voting-power/history.js", {
  VotingPowerHistory(v) {
    VotingPowerHistory = v;
  }

}, 5);

findVotingPower = (validator, genValidators) => {
  for (let v in genValidators) {
    if (validator.pub_key.value == genValidators[v].pub_key.value) {
      return parseInt(genValidators[v].power);
    }
  }
};

Meteor.methods({
  'chain.getConsensusState': function () {
    this.unblock();
    let url = RPC + '/dump_consensus_state';

    try {
      let response = HTTP.get(url);
      let consensus = JSON.parse(response.content);
      consensus = consensus.result;
      let height = consensus.round_state.height;
      let round = consensus.round_state.round;
      let step = consensus.round_state.step;
      let votedPower = Math.round(parseFloat(consensus.round_state.votes[round].prevotes_bit_array.split(" ")[3]) * 100);
      Chain.update({
        chainId: Meteor.settings.public.chainId
      }, {
        $set: {
          votingHeight: height,
          votingRound: round,
          votingStep: step,
          votedPower: votedPower,
          proposerAddress: consensus.round_state.validators.proposer.address,
          prevotes: consensus.round_state.votes[round].prevotes,
          precommits: consensus.round_state.votes[round].precommits
        }
      });
    } catch (e) {
      console.log(e);
    }
  },
  'chain.updateStatus': function () {
    this.unblock();
    let url = RPC + '/status';

    try {
      let response = HTTP.get(url);
      let status = JSON.parse(response.content);
      status = status.result;
      let chain = {};
      chain.chainId = status.node_info.network;
      chain.latestBlockHeight = status.sync_info.latest_block_height;
      chain.latestBlockTime = status.sync_info.latest_block_time;
      url = RPC + '/validators';
      response = HTTP.get(url);
      let validators = JSON.parse(response.content);
      validators = validators.result.validators;
      chain.validators = validators.length;
      let activeVP = 0;

      for (v in validators) {
        activeVP += parseInt(validators[v].voting_power);
      }

      chain.activeVotingPower = activeVP; // Get chain states

      if (parseInt(chain.latestBlockHeight) > 0) {
        let chainStates = {};
        chainStates.height = parseInt(status.sync_info.latest_block_height);
        chainStates.time = new Date(status.sync_info.latest_block_time);
        url = LCD + '/staking/pool';

        try {
          response = HTTP.get(url);
          let bonding = JSON.parse(response.content); // chain.bondedTokens = bonding.bonded_tokens;
          // chain.notBondedTokens = bonding.not_bonded_tokens;

          chainStates.bondedTokens = parseInt(bonding.bonded_tokens);
          chainStates.notBondedTokens = parseInt(bonding.not_bonded_tokens);
        } catch (e) {
          console.log(e);
        }

        url = LCD + '/distribution/community_pool';

        try {
          response = HTTP.get(url);
          let pool = JSON.parse(response.content);

          if (pool && pool.length > 0) {
            chainStates.communityPool = [];
            pool.forEach((amount, i) => {
              chainStates.communityPool.push({
                denom: amount.denom,
                amount: parseFloat(amount.amount)
              });
            });
          }
        } catch (e) {
          console.log(e);
        }

        url = LCD + '/minting/inflation';

        try {
          response = HTTP.get(url);
          let inflation = JSON.parse(response.content);

          if (inflation) {
            chainStates.inflation = parseFloat(inflation);
          }
        } catch (e) {
          console.log(e);
        }

        url = LCD + '/minting/deflation';

        try {
          response = HTTP.get(url);
          let deflation = JSON.parse(response.content);

          if (deflation) {
            chainStates.deflation = parseFloat(deflation);
          }
        } catch (e) {
          console.log(e);
        }

        url = LCD + '/minting/minting-speed';

        try {
          response = HTTP.get(url);
          let minting = JSON.parse(response.content);

          if (minting) {
            chainStates.minting = parseFloat(minting);
          }
        } catch (e) {
          console.log(e);
        }

        url = LCD + '/minting/annual-provisions';

        try {
          response = HTTP.get(url);
          let provisions = JSON.parse(response.content);

          if (provisions) {
            chainStates.annualProvisions = parseFloat(provisions);
          }
        } catch (e) {
          console.log(e);
        }

        ChainStates.insert(chainStates);
      } // chain.totalVotingPower = totalVP;


      Chain.update({
        chainId: chain.chainId
      }, {
        $set: chain
      }, {
        upsert: true
      }); // validators = Validators.find({}).fetch();
      // console.log(validators);

      return chain.latestBlockHeight;
    } catch (e) {
      console.log(e);
      return "Error getting chain status.";
    }
  },
  'chain.getLatestStatus': function () {
    Chain.find().sort({
      created: -1
    }).limit(1);
  },
  'chain.genesis': function () {
    let chain = Chain.findOne({
      chainId: Meteor.settings.public.chainId
    });

    if (chain && chain.readGenesis) {
      console.log('Genesis file has been processed');
    } else {
      console.log('=== Start processing genesis file ===');
      let response = HTTP.get(Meteor.settings.genesisFile);
      let genesis = JSON.parse(response.content);
      console.log(genesis.result.genesis);
      genesis = genesis.result.genesis;
      let chainParams = {
        chainId: genesis.chain_id,
        genesisTime: genesis.genesis_time,
        consensusParams: genesis.consensus_params,
        auth: genesis.app_state.auth,
        bank: genesis.app_state.bank,
        staking: {
          pool: genesis.app_state.staking.pool,
          params: genesis.app_state.staking.params
        },
        mint: genesis.app_state.mint,
        distr: {
          communityTax: genesis.app_state.distr.community_tax,
          baseProposerReward: genesis.app_state.distr.base_proposer_reward,
          bonusProposerReward: genesis.app_state.distr.bonus_proposer_reward,
          withdrawAddrEnabled: genesis.app_state.distr.withdraw_addr_enabled
        },
        gov: {
          startingProposalId: genesis.app_state.gov.starting_proposal_id,
          depositParams: genesis.app_state.gov.deposit_params,
          votingParams: genesis.app_state.gov.voting_params,
          tallyParams: genesis.app_state.gov.tally_params
        },
        slashing: {
          params: genesis.app_state.slashing.params
        }
      };
      let totalVotingPower = 0; // read gentx

      if (genesis.app_state.gentxs && genesis.app_state.gentxs.length > 0) {
        for (i in genesis.app_state.gentxs) {
          let msg = genesis.app_state.gentxs[i].value.msg; // console.log(msg.type);

          for (m in msg) {
            if (msg[m].type == "cosmos-sdk/MsgCreateValidator") {
              console.log(msg[m].value); // let command = Meteor.settings.bin.gaiadebug+" pubkey "+msg[m].value.pubkey;

              let validator = {
                consensus_pubkey: msg[m].value.pubkey,
                description: msg[m].value.description,
                commission: msg[m].value.commission,
                min_self_delegation: msg[m].value.min_self_delegation,
                operator_address: msg[m].value.validator_address,
                delegator_address: msg[m].value.delegator_address,
                voting_power: Math.floor(parseInt(msg[m].value.value.amount) / Meteor.settings.public.stakingFraction),
                jailed: false,
                status: 2
              };
              totalVotingPower += validator.voting_power;
              let pubkeyValue = Meteor.call('bech32ToPubkey', msg[m].value.pubkey); // Validators.upsert({consensus_pubkey:msg[m].value.pubkey},validator);

              validator.pub_key = {
                "type": "tendermint/PubKeyEd25519",
                "value": pubkeyValue
              };
              validator.address = getAddress(validator.pub_key);
              validator.accpub = Meteor.call('pubkeyToBech32', validator.pub_key, Meteor.settings.public.bech32PrefixAccPub);
              validator.operator_pubkey = Meteor.call('pubkeyToBech32', validator.pub_key, Meteor.settings.public.bech32PrefixValPub);
              VotingPowerHistory.insert({
                address: validator.address,
                prev_voting_power: 0,
                voting_power: validator.voting_power,
                type: 'add',
                height: 0,
                block_time: genesis.genesis_time
              });
              Validators.insert(validator);
            }
          }
        }
      } // read validators from previous chain


      console.log('read validators from previous chain');

      if (genesis.app_state.staking.validators && genesis.app_state.staking.validators.length > 0) {
        console.log(genesis.app_state.staking.validators.length);
        let genValidatorsSet = genesis.app_state.staking.validators;
        let genValidators = genesis.validators;

        for (let v in genValidatorsSet) {
          // console.log(genValidators[v]);
          let validator = genValidatorsSet[v];
          validator.delegator_address = Meteor.call('getDelegator', genValidatorsSet[v].operator_address);
          let pubkeyValue = Meteor.call('bech32ToPubkey', validator.consensus_pubkey);
          validator.pub_key = {
            "type": "tendermint/PubKeyEd25519",
            "value": pubkeyValue
          };
          validator.address = getAddress(validator.pub_key);
          validator.pub_key = validator.pub_key;
          validator.accpub = Meteor.call('pubkeyToBech32', validator.pub_key, Meteor.settings.public.bech32PrefixAccPub);
          validator.operator_pubkey = Meteor.call('pubkeyToBech32', validator.pub_key, Meteor.settings.public.bech32PrefixValPub);
          validator.voting_power = findVotingPower(validator, genValidators);
          totalVotingPower += validator.voting_power;
          Validators.upsert({
            consensus_pubkey: validator.consensus_pubkey
          }, validator);
          VotingPowerHistory.insert({
            address: validator.address,
            prev_voting_power: 0,
            voting_power: validator.voting_power,
            type: 'add',
            height: 0,
            block_time: genesis.genesis_time
          });
        }
      }

      chainParams.readGenesis = true;
      chainParams.activeVotingPower = totalVotingPower;
      let result = Chain.upsert({
        chainId: chainParams.chainId
      }, {
        $set: chainParams
      });
      console.log('=== Finished processing genesis file ===');
    }

    return true;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/chain/server/publications.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Chain, ChainStates;
module.link("../chain.js", {
  Chain(v) {
    Chain = v;
  },

  ChainStates(v) {
    ChainStates = v;
  }

}, 1);
let CoinStats;
module.link("../../coin-stats/coin-stats.js", {
  CoinStats(v) {
    CoinStats = v;
  }

}, 2);
let Validators;
module.link("../../validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 3);
Meteor.publish('chainStates.latest', function () {
  return [ChainStates.find({}, {
    sort: {
      height: -1
    },
    limit: 1
  }), CoinStats.find({}, {
    sort: {
      last_updated_at: -1
    },
    limit: 1
  })];
});
publishComposite('chain.status', function () {
  return {
    find() {
      return Chain.find({
        chainId: Meteor.settings.public.chainId
      });
    },

    children: [{
      find(chain) {
        return Validators.find({}, {
          fields: {
            address: 1,
            description: 1
          }
        });
      }

    }]
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"chain.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/chain/chain.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Chain: () => Chain,
  ChainStates: () => ChainStates
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let Validators;
module.link("../validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 1);
const Chain = new Mongo.Collection('chain');
const ChainStates = new Mongo.Collection('chain_states');
Chain.helpers({
  proposer() {
    return Validators.findOne({
      address: this.proposerAddress
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"coin-stats":{"server":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/coin-stats/server/methods.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let CoinStats;
module.link("../coin-stats.js", {
  CoinStats(v) {
    CoinStats = v;
  }

}, 1);
let HTTP;
module.link("meteor/http", {
  HTTP(v) {
    HTTP = v;
  }

}, 2);
Meteor.methods({
  'coinStats.getCoinStats': function () {
    this.unblock();
    let coinId = Meteor.settings.public.coingeckoId;

    if (coinId) {
      try {
        let now = new Date();
        now.setMinutes(0);
        let url = "https://api.coingecko.com/api/v3/simple/price?ids=" + coinId + "&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true";
        let response = HTTP.get(url);

        if (response.statusCode == 200) {
          // console.log(JSON.parse(response.content));
          let data = JSON.parse(response.content);
          data = data[coinId]; // console.log(coinStats);

          return CoinStats.insert(data);
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      return "No coingecko Id provided.";
    }
  },
  'coinStats.getStats': function () {
    this.unblock();
    let coinId = Meteor.settings.public.coingeckoId;

    if (coinId) {
      return CoinStats.findOne({}, {
        sort: {
          last_updated_at: -1
        }
      });
    } else {
      return "No coingecko Id provided.";
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"coin-stats.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/coin-stats/coin-stats.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  CoinStats: () => CoinStats
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const CoinStats = new Mongo.Collection('coin_stats');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"delegations":{"server":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/delegations/server/methods.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Delegations;
module.link("../delegations.js", {
  Delegations(v) {
    Delegations = v;
  }

}, 1);
let Validators;
module.link("../../validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 2);
Meteor.methods({
  'delegations.getDelegations': function () {
    this.unblock();
    let validators = Validators.find({}).fetch();
    let delegations = [];
    console.log("=== Getting delegations ===");

    for (v in validators) {
      if (validators[v].operator_address) {
        let url = LCD + '/staking/validators/' + validators[v].operator_address + "/delegations";

        try {
          let response = HTTP.get(url);

          if (response.statusCode == 200) {
            let delegation = JSON.parse(response.content); // console.log(delegation);

            delegations = delegations.concat(delegation);
          } else {
            console.log(response.statusCode);
          }
        } catch (e) {
          console.log(e);
        }
      }
    }

    for (i in delegations) {
      if (delegations[i] && delegations[i].shares) delegations[i].shares = parseFloat(delegations[i].shares);
    } // console.log(delegations);


    let data = {
      delegations: delegations,
      createdAt: new Date()
    };
    return Delegations.insert(data);
  } // 'blocks.averageBlockTime'(address){
  //     let blocks = Blockscon.find({proposerAddress:address}).fetch();
  //     let heights = blocks.map((block, i) => {
  //         return block.height;
  //     });
  //     let blocksStats = Analytics.find({height:{$in:heights}}).fetch();
  //     // console.log(blocksStats);
  //     let totalBlockDiff = 0;
  //     for (b in blocksStats){
  //         totalBlockDiff += blocksStats[b].timeDiff;
  //     }
  //     return totalBlockDiff/heights.length;
  // }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/delegations/server/publications.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"delegations.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/delegations/delegations.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Delegations: () => Delegations
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const Delegations = new Mongo.Collection('delegations');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"fundingcycles":{"server":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/fundingcycles/server/methods.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let HTTP;
module.link("meteor/http", {
  HTTP(v) {
    HTTP = v;
  }

}, 1);
let FundingCycless;
module.link("../fundingcycles.js", {
  FundingCycless(v) {
    FundingCycless = v;
  }

}, 2);
Meteor.methods({
  'FundingCycles.getFundingCycles': function () {
    this.unblock();

    try {
      let url = LCD + '/gov/fundingcycles';
      let response = HTTP.get(url);
      let FundingCycles = JSON.parse(response.content); // console.log(FundingCycles);

      let FundingCycleIds = [];

      if (FundingCycles.length > 0) {
        // FundingCycles.upsert()
        const bulkFundingCycles = FundingCycless.rawCollection().initializeUnorderedBulkOp();

        for (let i in FundingCycles) {
          let FundingCycle = FundingCycles[i];
          FundingCycle.cycleId = parseInt(FundingCycle.cycle_id);

          if (FundingCycle.cycleId >= 0) {
            try {
              let url = LCD + '/gov/fundingcycles/' + FundingCycle.cycleId;
              let response = HTTP.get(url);

              if (response.statusCode == 200) {
                let proposer = JSON.parse(response.content);

                if (proposer.cycle_id && proposer.cycle_id == FundingCycle.cycle_id) {
                  FundingCycle.proposer = proposer.proposer;
                }
              }

              bulkFundingCycles.find({
                cycleId: FundingCycle.cycleId
              }).upsert().updateOne({
                $set: FundingCycle
              });
              FundingCycleIds.push(FundingCycle.cycleId);
            } catch (e) {
              bulkFundingCycles.find({
                cycleId: FundingCycle.cycleId
              }).upsert().updateOne({
                $set: FundingCycle
              });
              FundingCycleIds.push(FundingCycle.cycleId);
              console.log(e.response.content);
            }
          }
        } // bulkFundingCycles.find({cycleId:{$nin:FundingCycleIds}}).update({$set:{"value.proposal_status":"Removed"}});


        bulkFundingCycles.execute();
      }
    } catch (e) {
      console.log(e);
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/fundingcycles/server/publications.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let FundingCycless;
module.link("../fundingcycles.js", {
  FundingCycless(v) {
    FundingCycless = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
Meteor.publish('fundingcycles.list', function () {
  return FundingCycless.find({}, {
    sort: {
      cycleId: -1
    }
  });
});
Meteor.publish('fundingcycles.one', function (id) {
  check(id, Number);
  return FundingCycless.find({
    cycleId: id
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"fundingcycles.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/fundingcycles/fundingcycles.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  FundingCycless: () => FundingCycless
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const FundingCycless = new Mongo.Collection('fundingcycles');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"proposals":{"server":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/proposals/server/methods.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let HTTP;
module.link("meteor/http", {
  HTTP(v) {
    HTTP = v;
  }

}, 1);
let Proposals;
module.link("../proposals.js", {
  Proposals(v) {
    Proposals = v;
  }

}, 2);
let Validators;
module.link("../../validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 3);
// import { Promise } from 'meteor/promise';
Meteor.methods({
  'proposals.getProposals': function () {
    this.unblock();

    try {
      let url = LCD + '/gov/proposals';
      let response = HTTP.get(url);
      let proposals = JSON.parse(response.content); // console.log(proposals);

      let proposalIds = [];

      if (proposals.length > 0) {
        // Proposals.upsert()
        const bulkProposals = Proposals.rawCollection().initializeUnorderedBulkOp();

        for (let i in proposals) {
          let proposal = proposals[i];
          proposal.proposalId = parseInt(proposal.proposal_id);

          if (proposal.proposalId > 0) {
            try {
              let url = LCD + '/gov/proposals/' + proposal.proposalId + '/proposer';
              let response = HTTP.get(url);

              if (response.statusCode == 200) {
                let proposer = JSON.parse(response.content);

                if (proposer.proposal_id && proposer.proposal_id == proposal.proposal_id) {
                  proposal.proposer = proposer.proposer;
                }
              }

              bulkProposals.find({
                proposalId: proposal.proposalId
              }).upsert().updateOne({
                $set: proposal
              });
              proposalIds.push(proposal.proposalId);
            } catch (e) {
              bulkProposals.find({
                proposalId: proposal.proposalId
              }).upsert().updateOne({
                $set: proposal
              });
              proposalIds.push(proposal.proposalId);
              console.log(e.response.content);
            }
          }
        }

        bulkProposals.find({
          proposalId: {
            $nin: proposalIds
          }
        }).update({
          $set: {
            "value.proposal_status": "Removed"
          }
        });
        bulkProposals.execute();
      }
    } catch (e) {
      console.log(e);
    }
  },
  'proposals.getProposalResults': function () {
    this.unblock();
    let proposals = Proposals.find({
      "proposal_status": {
        $in: ["Passed", "Rejected", "Removed", "VotingPeriod"]
      }
    }).fetch();

    if (proposals && proposals.length > 0) {
      for (let i in proposals) {
        if (parseInt(proposals[i].proposalId) > 0) {
          try {
            // get proposal deposits
            let url = LCD + '/gov/proposals/' + proposals[i].proposalId + '/deposits';
            let response = HTTP.get(url);
            let proposal = {
              proposalId: proposals[i].proposalId
            };

            if (response.statusCode == 200) {
              let deposits = JSON.parse(response.content);
              proposal.deposits = deposits;
            }

            url = LCD + '/gov/proposals/' + proposals[i].proposalId + '/votes';
            response = HTTP.get(url);

            if (response.statusCode == 200) {
              let votes = JSON.parse(response.content);
              proposal.votes = getVoteDetail(votes);
            }

            url = LCD + '/gov/proposals/' + proposals[i].proposalId + '/tally';
            response = HTTP.get(url);

            if (response.statusCode == 200) {
              let tally = JSON.parse(response.content);
              proposal.tally = tally;
            }

            proposal.updatedAt = new Date();
            Proposals.update({
              proposalId: proposals[i].proposalId
            }, {
              $set: proposal
            });
          } catch (e) {}
        }
      }
    }
  }
});

const getVoteDetail = votes => {
  if (!votes) {
    return [];
  }

  let voters = votes.map(vote => vote.voter);
  let votingPowerMap = {};
  let validatorAddressMap = {};
  Validators.find({
    delegator_address: {
      $in: voters
    }
  }).forEach(validator => {
    votingPowerMap[validator.delegator_address] = {
      moniker: validator.description.moniker,
      address: validator.address,
      tokens: parseFloat(validator.tokens),
      delegatorShares: parseFloat(validator.delegator_shares),
      deductedShares: parseFloat(validator.delegator_shares)
    };
    validatorAddressMap[validator.operator_address] = validator.delegator_address;
  });
  voters.forEach(voter => {
    if (!votingPowerMap[voter]) {
      // voter is not a validator
      let url = `${LCD}/staking/delegators/${voter}/delegations`;
      let delegations;
      let votingPower = 0;

      try {
        let response = HTTP.get(url);

        if (response.statusCode == 200) {
          delegations = JSON.parse(response.content);

          if (delegations) {
            delegations.forEach(delegation => {
              let shares = parseFloat(delegation.shares);

              if (validatorAddressMap[delegation.validator_address]) {
                // deduct delegated shareds from validator if a delegator votes
                let validator = votingPowerMap[validatorAddressMap[delegation.validator_address]];
                validator.deductedShares -= shares;

                if (validator.delegator_shares != 0) {
                  // avoiding division by zero
                  votingPower += shares / validator.delegatorShares * validator.tokens;
                }
              } else {
                let validator = Validators.findOne({
                  operator_address: delegation.validator_address
                });

                if (validator && validator.delegator_shares != 0) {
                  // avoiding division by zero
                  votingPower += shares / parseFloat(validator.delegator_shares) * parseFloat(validator.tokens);
                }
              }
            });
          }
        }
      } catch (e) {
        console.log(e);
      }

      votingPowerMap[voter] = {
        votingPower: votingPower
      };
    }
  });
  return votes.map(vote => {
    let voter = votingPowerMap[vote.voter];
    let votingPower = voter.votingPower;

    if (votingPower == undefined) {
      // voter is a validator
      votingPower = voter.delegatorShares ? voter.deductedShares / voter.delegatorShares * voter.tokens : 0;
    }

    return (0, _objectSpread2.default)({}, vote, {
      votingPower
    });
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/proposals/server/publications.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Proposals;
module.link("../proposals.js", {
  Proposals(v) {
    Proposals = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
Meteor.publish('proposals.list', function () {
  return Proposals.find({}, {
    sort: {
      proposalId: -1
    }
  });
});
Meteor.publish('proposals.one', function (id) {
  check(id, Number);
  return Proposals.find({
    proposalId: id
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"proposals.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/proposals/proposals.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Proposals: () => Proposals
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const Proposals = new Mongo.Collection('proposals');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"records":{"server":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/records/server/methods.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let ValidatorRecords, Analytics, AverageData, AverageValidatorData;
module.link("../records.js", {
  ValidatorRecords(v) {
    ValidatorRecords = v;
  },

  Analytics(v) {
    Analytics = v;
  },

  AverageData(v) {
    AverageData = v;
  },

  AverageValidatorData(v) {
    AverageValidatorData = v;
  }

}, 1);
let Validators;
module.link("../../validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 2);
let Status;
module.link("../../status/status.js", {
  Status(v) {
    Status = v;
  }

}, 3);
let MissedBlocksStats;
module.link("../records.js", {
  MissedBlocksStats(v) {
    MissedBlocksStats = v;
  }

}, 4);
let Blockscon;
module.link("../../blocks/blocks.js", {
  Blockscon(v) {
    Blockscon = v;
  }

}, 5);
let Chain;
module.link("../../chain/chain.js", {
  Chain(v) {
    Chain = v;
  }

}, 6);
Meteor.methods({
  'ValidatorRecords.missedBlocksCount': function (address) {
    this.unblock();
    return ValidatorRecords.find({
      address: address
    }).count();
  },
  'ValidatorRecords.calculateMissedBlocks': function () {
    // console.log("ValidatorRecords.calculateMissedBlocks: "+COUNTMISSEDBLOCKS);
    if (!COUNTMISSEDBLOCKS) {
      COUNTMISSEDBLOCKS = true;
      console.log('calulate missed blocks count');
      this.unblock();
      let validators = Validators.find({}).fetch();
      let latestHeight = Meteor.call('blocks.getCurrentHeight');
      let explorerStatus = Status.findOne({
        chainId: Meteor.settings.public.chainId
      });
      let startHeight = explorerStatus && explorerStatus.lastMissedBlockHeight ? explorerStatus.lastMissedBlockHeight : Meteor.settings.params.startHeight; // console.log(latestHeight);
      // console.log(startHeight);

      const bulkMissedStats = MissedBlocksStats.rawCollection().initializeUnorderedBulkOp();

      for (i in validators) {
        // if ((validators[i].address == "B8552EAC0D123A6BF609123047A5181D45EE90B5") || (validators[i].address == "69D99B2C66043ACBEAA8447525C356AFC6408E0C") || (validators[i].address == "35AD7A2CD2FC71711A675830EC1158082273D457")){
        let voterAddress = validators[i].address;
        let missedRecords = ValidatorRecords.find({
          address: voterAddress,
          exists: false,
          $and: [{
            height: {
              $gt: startHeight
            }
          }, {
            height: {
              $lte: latestHeight
            }
          }]
        }).fetch();
        let counts = {}; // console.log("missedRecords to process: "+missedRecords.length);

        for (b in missedRecords) {
          let block = Blockscon.findOne({
            height: missedRecords[b].height
          });
          let existingRecord = MissedBlocksStats.findOne({
            voter: voterAddress,
            proposer: block.proposerAddress
          });

          if (typeof counts[block.proposerAddress] === 'undefined') {
            if (existingRecord) {
              counts[block.proposerAddress] = existingRecord.count + 1;
            } else {
              counts[block.proposerAddress] = 1;
            }
          } else {
            counts[block.proposerAddress]++;
          }
        }

        for (address in counts) {
          let data = {
            voter: voterAddress,
            proposer: address,
            count: counts[address]
          };
          bulkMissedStats.find({
            voter: voterAddress,
            proposer: address
          }).upsert().updateOne({
            $set: data
          });
        } // }

      }

      if (bulkMissedStats.length > 0) {
        bulkMissedStats.execute(Meteor.bindEnvironment((err, result) => {
          if (err) {
            COUNTMISSEDBLOCKS = false;
            console.log(err);
          }

          if (result) {
            Status.upsert({
              chainId: Meteor.settings.public.chainId
            }, {
              $set: {
                lastMissedBlockHeight: latestHeight,
                lastMissedBlockTime: new Date()
              }
            });
            COUNTMISSEDBLOCKS = false;
            console.log("done");
          }
        }));
      } else {
        COUNTMISSEDBLOCKS = false;
      }

      return true;
    } else {
      return "updating...";
    }
  },
  'Analytics.aggregateBlockTimeAndVotingPower': function (time) {
    this.unblock();
    let now = new Date();

    if (time == 'm') {
      let averageBlockTime = 0;
      let averageVotingPower = 0;
      let analytics = Analytics.find({
        "time": {
          $gt: new Date(Date.now() - 60 * 1000)
        }
      }).fetch();

      if (analytics.length > 0) {
        for (i in analytics) {
          averageBlockTime += analytics[i].timeDiff;
          averageVotingPower += analytics[i].voting_power;
        }

        averageBlockTime = averageBlockTime / analytics.length;
        averageVotingPower = averageVotingPower / analytics.length;
        Chain.update({
          chainId: Meteor.settings.public.chainId
        }, {
          $set: {
            lastMinuteVotingPower: averageVotingPower,
            lastMinuteBlockTime: averageBlockTime
          }
        });
        AverageData.insert({
          averageBlockTime: averageBlockTime,
          averageVotingPower: averageVotingPower,
          type: time,
          createdAt: now
        });
      }
    }

    if (time == 'h') {
      let averageBlockTime = 0;
      let averageVotingPower = 0;
      let analytics = Analytics.find({
        "time": {
          $gt: new Date(Date.now() - 60 * 60 * 1000)
        }
      }).fetch();

      if (analytics.length > 0) {
        for (i in analytics) {
          averageBlockTime += analytics[i].timeDiff;
          averageVotingPower += analytics[i].voting_power;
        }

        averageBlockTime = averageBlockTime / analytics.length;
        averageVotingPower = averageVotingPower / analytics.length;
        Chain.update({
          chainId: Meteor.settings.public.chainId
        }, {
          $set: {
            lastHourVotingPower: averageVotingPower,
            lastHourBlockTime: averageBlockTime
          }
        });
        AverageData.insert({
          averageBlockTime: averageBlockTime,
          averageVotingPower: averageVotingPower,
          type: time,
          createdAt: now
        });
      }
    }

    if (time == 'd') {
      let averageBlockTime = 0;
      let averageVotingPower = 0;
      let analytics = Analytics.find({
        "time": {
          $gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }).fetch();

      if (analytics.length > 0) {
        for (i in analytics) {
          averageBlockTime += analytics[i].timeDiff;
          averageVotingPower += analytics[i].voting_power;
        }

        averageBlockTime = averageBlockTime / analytics.length;
        averageVotingPower = averageVotingPower / analytics.length;
        Chain.update({
          chainId: Meteor.settings.public.chainId
        }, {
          $set: {
            lastDayVotingPower: averageVotingPower,
            lastDayBlockTime: averageBlockTime
          }
        });
        AverageData.insert({
          averageBlockTime: averageBlockTime,
          averageVotingPower: averageVotingPower,
          type: time,
          createdAt: now
        });
      }
    } // return analytics.length;

  },
  'Analytics.aggregateValidatorDailyBlockTime': function () {
    this.unblock();
    let validators = Validators.find({}).fetch();
    let now = new Date();

    for (i in validators) {
      let averageBlockTime = 0;
      let blocks = Blockscon.find({
        proposerAddress: validators[i].address,
        "time": {
          $gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }, {
        fields: {
          height: 1
        }
      }).fetch(); // console.log(blocks);

      if (blocks.length > 0) {
        let blockHeights = [];

        for (b in blocks) {
          blockHeights.push(blocks[b].height);
        } // console.log(blockHeights);


        let analytics = Analytics.find({
          height: {
            $in: blockHeights
          }
        }, {
          fields: {
            height: 1,
            timeDiff: 1
          }
        }).fetch(); // console.log(analytics);

        for (a in analytics) {
          averageBlockTime += analytics[a].timeDiff;
        }

        averageBlockTime = averageBlockTime / analytics.length;
      }

      AverageValidatorData.insert({
        proposerAddress: validators[i].address,
        averageBlockTime: averageBlockTime,
        type: 'ValidatorDailyAverageBlockTime',
        createdAt: now
      });
    }

    return true;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/records/server/publications.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let ValidatorRecords, Analytics, MissedBlocksStats, VPDistributions;
module.link("../records.js", {
  ValidatorRecords(v) {
    ValidatorRecords = v;
  },

  Analytics(v) {
    Analytics = v;
  },

  MissedBlocksStats(v) {
    MissedBlocksStats = v;
  },

  VPDistributions(v) {
    VPDistributions = v;
  }

}, 1);
let Validators;
module.link("../../validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 2);
Meteor.publish('validator_records.all', function () {
  return ValidatorRecords.find();
});
Meteor.publish('validator_records.uptime', function (address, num) {
  return ValidatorRecords.find({
    address: address
  }, {
    limit: num,
    sort: {
      height: -1
    }
  });
});
Meteor.publish('analytics.history', function () {
  return Analytics.find({}, {
    sort: {
      height: -1
    },
    limit: 50
  });
});
Meteor.publish('vpDistribution.latest', function () {
  return VPDistributions.find({}, {
    sort: {
      height: -1
    },
    limit: 1
  });
});
publishComposite('missedblocks.validator', function (address, type) {
  let conditions = {};

  if (type == 'voter') {
    conditions = {
      voter: address
    };
  } else {
    conditions = {
      proposer: address
    };
  }

  return {
    find() {
      return MissedBlocksStats.find(conditions);
    },

    children: [{
      find(stats) {
        return Validators.find({}, {
          fields: {
            address: 1,
            description: 1
          }
        });
      }

    }]
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"records.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/records/records.js                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  ValidatorRecords: () => ValidatorRecords,
  Analytics: () => Analytics,
  MissedBlocksStats: () => MissedBlocksStats,
  VPDistributions: () => VPDistributions,
  AverageData: () => AverageData,
  AverageValidatorData: () => AverageValidatorData
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let Validators;
module.link("../validators/validators", {
  Validators(v) {
    Validators = v;
  }

}, 1);
const ValidatorRecords = new Mongo.Collection('validator_records');
const Analytics = new Mongo.Collection('analytics');
const MissedBlocksStats = new Mongo.Collection('missed_blocks_stats');
const VPDistributions = new Mongo.Collection('voting_power_distributions');
const AverageData = new Mongo.Collection('average_data');
const AverageValidatorData = new Mongo.Collection('average_validator_data');
MissedBlocksStats.helpers({
  proposerMoniker() {
    let validator = Validators.findOne({
      address: this.proposer
    });
    return validator.description ? validator.description.moniker : this.proposer;
  },

  voterMoniker() {
    let validator = Validators.findOne({
      address: this.voter
    });
    return validator.description ? validator.description.moniker : this.voter;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"status":{"server":{"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/status/server/publications.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Status;
module.link("../status.js", {
  Status(v) {
    Status = v;
  }

}, 1);
let check;
module.link("meteor/check", {
  check(v) {
    check = v;
  }

}, 2);
Meteor.publish('status.status', function () {
  return Status.find({
    chainId: Meteor.settings.public.chainId
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"status.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/status/status.js                                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Status: () => Status
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const Status = new Mongo.Collection('status');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"transactions":{"server":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/transactions/server/methods.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let HTTP;
module.link("meteor/http", {
  HTTP(v) {
    HTTP = v;
  }

}, 1);
let Transactions;
module.link("../../transactions/transactions.js", {
  Transactions(v) {
    Transactions = v;
  }

}, 2);
let Validators;
module.link("../../validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 3);
let VotingPowerHistory;
module.link("../../voting-power/history.js", {
  VotingPowerHistory(v) {
    VotingPowerHistory = v;
  }

}, 4);
Meteor.methods({
  'Transactions.index': function (hash, blockTime) {
    this.unblock();
    hash = hash.toUpperCase();
    let url = LCD + '/txs/' + hash;
    let response = HTTP.get(url);
    let tx = JSON.parse(response.content);
    console.log(hash);
    tx.height = parseInt(tx.height);
    let txId = Transactions.insert(tx);

    if (txId) {
      return txId;
    } else return false;
  },
  'Transactions.findDelegation': function (address, height) {
    return Transactions.find({
      $or: [{
        $and: [{
          "tags.key": "action"
        }, {
          "tags.value": "delegate"
        }, {
          "tags.key": "destination-validator"
        }, {
          "tags.value": address
        }]
      }, {
        $and: [{
          "tags.key": "action"
        }, {
          "tags.value": "unjail"
        }, {
          "tags.key": "validator"
        }, {
          "tags.value": address
        }]
      }, {
        $and: [{
          "tags.key": "action"
        }, {
          "tags.value": "create_validator"
        }, {
          "tags.key": "destination-validator"
        }, {
          "tags.value": address
        }]
      }, {
        $and: [{
          "tags.key": "action"
        }, {
          "tags.value": "begin_unbonding"
        }, {
          "tags.key": "source-validator"
        }, {
          "tags.value": address
        }]
      }, {
        $and: [{
          "tags.key": "action"
        }, {
          "tags.value": "begin_redelegate"
        }, {
          "tags.key": "destination-validator"
        }, {
          "tags.value": address
        }]
      }],
      "code": {
        $exists: false
      },
      height: {
        $lt: height
      }
    }, {
      sort: {
        height: -1
      },
      limit: 1
    }).fetch();
  },
  'Transactions.findUser': function (address) {
    // address is either delegator address or validator operator address
    let validator;

    if (address.includes(Meteor.settings.public.bech32PrefixValAddr)) {
      // validator operator address
      validator = Validators.findOne({
        operator_address: address
      }, {
        fields: {
          address: 1,
          description: 1,
          operator_address: 1,
          delegator_address: 1
        }
      });
    } else if (address.includes(Meteor.settings.public.bech32PrefixAccAddr)) {
      // delegator address
      validator = Validators.findOne({
        delegator_address: address
      }, {
        fields: {
          address: 1,
          description: 1,
          operator_address: 1,
          delegator_address: 1
        }
      });
    }

    if (validator) {
      return validator;
    }

    return false;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/transactions/server/publications.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Transactions;
module.link("../transactions.js", {
  Transactions(v) {
    Transactions = v;
  }

}, 1);
let Blockscon;
module.link("../../blocks/blocks.js", {
  Blockscon(v) {
    Blockscon = v;
  }

}, 2);
publishComposite('transactions.list', function (limit = 30) {
  return {
    find() {
      return Transactions.find({}, {
        sort: {
          height: -1
        },
        limit: limit
      });
    },

    children: [{
      find(tx) {
        return Blockscon.find({
          height: tx.height
        }, {
          fields: {
            time: 1,
            height: 1
          }
        });
      }

    }]
  };
});
publishComposite('transactions.validator', function (validatorAddress, delegatorAddress, limit = 100) {
  let query = {};

  if (validatorAddress && delegatorAddress) {
    query = {
      $or: [{
        "tags.value": validatorAddress
      }, {
        "tags.value": delegatorAddress
      }]
    };
  }

  if (!validatorAddress && delegatorAddress) {
    query = {
      "tags.value": delegatorAddress
    };
  }

  return {
    find() {
      return Transactions.find(query, {
        sort: {
          height: -1
        },
        limit: limit
      });
    },

    children: [{
      find(tx) {
        return Blockscon.find({
          height: tx.height
        }, {
          fields: {
            time: 1,
            height: 1
          }
        });
      }

    }]
  };
});
publishComposite('transactions.findOne', function (hash) {
  return {
    find() {
      return Transactions.find({
        txhash: hash
      });
    },

    children: [{
      find(tx) {
        return Blockscon.find({
          height: tx.height
        }, {
          fields: {
            time: 1,
            height: 1
          }
        });
      }

    }]
  };
});
publishComposite('transactions.height', function (height) {
  return {
    find() {
      return Transactions.find({
        height: height
      });
    },

    children: [{
      find(tx) {
        return Blockscon.find({
          height: tx.height
        }, {
          fields: {
            time: 1,
            height: 1
          }
        });
      }

    }]
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"transactions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/transactions/transactions.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Transactions: () => Transactions
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let Blockscon;
module.link("../blocks/blocks.js", {
  Blockscon(v) {
    Blockscon = v;
  }

}, 1);
let TxIcon;
module.link("../../ui/components/Icons.jsx", {
  TxIcon(v) {
    TxIcon = v;
  }

}, 2);
const Transactions = new Mongo.Collection('transactions');
Transactions.helpers({
  block() {
    return Blockscon.findOne({
      height: this.height
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"validators":{"server":{"methods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/validators/server/methods.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Transactions;
module.link("../../transactions/transactions.js", {
  Transactions(v) {
    Transactions = v;
  }

}, 1);
let Blockscon;
module.link("../../blocks/blocks.js", {
  Blockscon(v) {
    Blockscon = v;
  }

}, 2);
let Delegations;
module.link("../../delegations/delegations.js", {
  Delegations(v) {
    Delegations = v;
  }

}, 3);
Meteor.methods({
  'Validators.findCreateValidatorTime': function (address) {
    // look up the create validator time to consider if the validator has never updated the commission
    let tx = Transactions.findOne({
      $and: [{
        "tx.value.msg.value.delegator_address": address
      }, {
        "tx.value.msg.type": "cosmos-sdk/MsgCreateValidator"
      }, {
        code: {
          $exists: false
        }
      }]
    });

    if (tx) {
      let block = Blockscon.findOne({
        height: tx.height
      });

      if (block) {
        return block.time;
      }
    } else {
      // no such create validator tx
      return false;
    }
  },

  // async 'Validators.getAllDelegations'(address){
  'Validators.getAllDelegations'(address) {
    let url = LCD + '/staking/validators/' + address + '/delegations';

    try {
      let delegations = HTTP.get(url);

      if (delegations.statusCode == 200) {
        delegations = JSON.parse(delegations.content);
        delegations.forEach((delegation, i) => {
          if (delegations[i] && delegations[i].shares) delegations[i].shares = parseFloat(delegations[i].shares);
        });
        return delegations;
      }

      ;
    } catch (e) {
      console.log(e);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/validators/server/publications.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let Validators;
module.link("../validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 1);
let ValidatorRecords;
module.link("../../records/records.js", {
  ValidatorRecords(v) {
    ValidatorRecords = v;
  }

}, 2);
let VotingPowerHistory;
module.link("../../voting-power/history.js", {
  VotingPowerHistory(v) {
    VotingPowerHistory = v;
  }

}, 3);
Meteor.publish('validators.all', function (sort = "description.moniker", direction = -1) {
  return Validators.find({});
});
publishComposite('validators.firstSeen', {
  find() {
    return Validators.find({});
  },

  children: [{
    find(val) {
      return ValidatorRecords.find({
        address: val.address
      }, {
        sort: {
          height: 1
        },
        limit: 1
      });
    }

  }]
});
Meteor.publish('validators.voting_power', function () {
  return Validators.find({
    status: 2,
    jailed: false
  }, {
    sort: {
      voting_power: -1
    },
    fields: {
      address: 1,
      description: 1,
      voting_power: 1
    }
  });
});
publishComposite('validator.details', function (address) {
  let options = {
    address: address
  };

  if (address.indexOf(Meteor.settings.public.bech32PrefixValAddr) != -1) {
    options = {
      operator_address: address
    };
  }

  return {
    find() {
      return Validators.find(options);
    },

    children: [{
      find(val) {
        return VotingPowerHistory.find({
          address: val.address
        }, {
          sort: {
            height: -1
          },
          limit: 50
        });
      }

    }, {
      find(val) {
        return ValidatorRecords.find({
          address: val.address
        }, {
          sort: {
            height: -1
          },
          limit: Meteor.settings.public.uptimeWindow
        });
      }

    }]
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"validators.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/validators/validators.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Validators: () => Validators
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let ValidatorRecords;
module.link("../records/records.js", {
  ValidatorRecords(v) {
    ValidatorRecords = v;
  }

}, 1);
let VotingPowerHistory;
module.link("../voting-power/history.js", {
  VotingPowerHistory(v) {
    VotingPowerHistory = v;
  }

}, 2);
const Validators = new Mongo.Collection('validators');
Validators.helpers({
  firstSeen() {
    return ValidatorRecords.findOne({
      address: this.address
    });
  },

  history() {
    return VotingPowerHistory.find({
      address: this.address
    }, {
      sort: {
        height: -1
      },
      limit: 50
    }).fetch();
  }

}); // Validators.helpers({
//     uptime(){
//         // console.log(this.address);
//         let lastHundred = ValidatorRecords.find({address:this.address}, {sort:{height:-1}, limit:100}).fetch();
//         console.log(lastHundred);
//         let uptime = 0;
//         for (i in lastHundred){
//             if (lastHundred[i].exists){
//                 uptime+=1;
//             }
//         }
//         return uptime;
//     }
// })
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"voting-power":{"server":{"publications.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voting-power/server/publications.js                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"history.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/voting-power/history.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  VotingPowerHistory: () => VotingPowerHistory
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const VotingPowerHistory = new Mongo.Collection('voting_power_history');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"evidences":{"evidences.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/evidences/evidences.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Evidences: () => Evidences
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const Evidences = new Mongo.Collection('evidences');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"validator-sets":{"validator-sets.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/api/validator-sets/validator-sets.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  ValidatorSets: () => ValidatorSets
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const ValidatorSets = new Mongo.Collection('validator_sets');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"startup":{"both":{"index.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/both/index.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Import modules used by both client and server through a single index entry point
// e.g. useraccounts configuration file.
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"create-indexes.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/create-indexes.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Blockscon;
module.link("../../api/blocks/blocks.js", {
  Blockscon(v) {
    Blockscon = v;
  }

}, 0);
let Proposals;
module.link("../../api/proposals/proposals.js", {
  Proposals(v) {
    Proposals = v;
  }

}, 1);
let FundingCycless;
module.link("../../api/fundingcycles/fundingcycles.js", {
  FundingCycless(v) {
    FundingCycless = v;
  }

}, 2);
let ValidatorRecords, Analytics, MissedBlocksStats, AverageData, AverageValidatorData;
module.link("../../api/records/records.js", {
  ValidatorRecords(v) {
    ValidatorRecords = v;
  },

  Analytics(v) {
    Analytics = v;
  },

  MissedBlocksStats(v) {
    MissedBlocksStats = v;
  },

  AverageData(v) {
    AverageData = v;
  },

  AverageValidatorData(v) {
    AverageValidatorData = v;
  }

}, 3);
let Transactions;
module.link("../../api/transactions/transactions.js", {
  Transactions(v) {
    Transactions = v;
  }

}, 4);
let ValidatorSets;
module.link("../../api/validator-sets/validator-sets.js", {
  ValidatorSets(v) {
    ValidatorSets = v;
  }

}, 5);
let Validators;
module.link("../../api/validators/validators.js", {
  Validators(v) {
    Validators = v;
  }

}, 6);
let VotingPowerHistory;
module.link("../../api/voting-power/history.js", {
  VotingPowerHistory(v) {
    VotingPowerHistory = v;
  }

}, 7);
let Evidences;
module.link("../../api/evidences/evidences.js", {
  Evidences(v) {
    Evidences = v;
  }

}, 8);
let CoinStats;
module.link("../../api/coin-stats/coin-stats.js", {
  CoinStats(v) {
    CoinStats = v;
  }

}, 9);
let ChainStates;
module.link("../../api/chain/chain.js", {
  ChainStates(v) {
    ChainStates = v;
  }

}, 10);
ChainStates.rawCollection().createIndex({
  height: -1
}, {
  unique: true
});
Blockscon.rawCollection().createIndex({
  height: -1
}, {
  unique: true
});
Blockscon.rawCollection().createIndex({
  proposerAddress: 1
});
Evidences.rawCollection().createIndex({
  height: -1
});
Proposals.rawCollection().createIndex({
  proposalId: 1
}, {
  unique: true
});
FundingCycless.rawCollection().createIndex({
  cycleId: 1
}, {
  unique: true
});
ValidatorRecords.rawCollection().createIndex({
  address: 1,
  height: -1
}, {
  unique: 1
});
Analytics.rawCollection().createIndex({
  height: -1
}, {
  unique: true
});
MissedBlocksStats.rawCollection().createIndex({
  proposer: 1
});
MissedBlocksStats.rawCollection().createIndex({
  voter: 1
});
MissedBlocksStats.rawCollection().createIndex({
  proposer: 1,
  voter: 1
}, {
  unique: true
});
AverageData.rawCollection().createIndex({
  type: 1,
  createdAt: -1
}, {
  unique: true
});
AverageValidatorData.rawCollection().createIndex({
  proposerAddress: 1,
  createdAt: -1
}, {
  unique: true
}); // Status.rawCollection.createIndex({})

Transactions.rawCollection().createIndex({
  txhash: 1
}, {
  unique: true
});
Transactions.rawCollection().createIndex({
  height: -1
}); // Transactions.rawCollection().createIndex({action:1});

Transactions.rawCollection().createIndex({
  "tags.key": 1
});
Transactions.rawCollection().createIndex({
  "tags.value": 1
});
ValidatorSets.rawCollection().createIndex({
  block_height: -1
});
Validators.rawCollection().createIndex({
  address: 1
}, {
  unique: true,
  partialFilterExpression: {
    address: {
      $exists: true
    }
  }
});
Validators.rawCollection().createIndex({
  consensus_pubkey: 1
}, {
  unique: true
});
Validators.rawCollection().createIndex({
  "pub_key.value": 1
}, {
  unique: true,
  partialFilterExpression: {
    "pub_key.value": {
      $exists: true
    }
  }
});
VotingPowerHistory.rawCollection().createIndex({
  address: 1,
  height: -1
});
VotingPowerHistory.rawCollection().createIndex({
  type: 1
});
CoinStats.rawCollection().createIndex({
  last_updated_at: -1
}, {
  unique: true
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/index.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("./util.js");
module.link("./register-api.js");
module.link("./create-indexes.js");
let onPageLoad;
module.link("meteor/server-render", {
  onPageLoad(v) {
    onPageLoad = v;
  }

}, 0);
let Helmet;
module.link("react-helmet", {
  Helmet(v) {
    Helmet = v;
  }

}, 1);
// import App from '../../ui/App.jsx';
onPageLoad(sink => {
  // const context = {};
  // const sheet = new ServerStyleSheet()
  // const html = renderToString(sheet.collectStyles(
  //     <StaticRouter location={sink.request.url} context={context}>
  //         <App />
  //     </StaticRouter>
  //   ));
  // sink.renderIntoElementById('app', html);
  const helmet = Helmet.renderStatic();
  sink.appendToHead(helmet.meta.toString());
  sink.appendToHead(helmet.title.toString()); // sink.appendToHead(sheet.getStyleTags());
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"register-api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/register-api.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("../../api/chain/server/methods.js");
module.link("../../api/chain/server/publications.js");
module.link("../../api/blocks/server/methods.js");
module.link("../../api/blocks/server/publications.js");
module.link("../../api/validators/server/methods.js");
module.link("../../api/validators/server/publications.js");
module.link("../../api/records/server/methods.js");
module.link("../../api/records/server/publications.js");
module.link("../../api/proposals/server/methods.js");
module.link("../../api/proposals/server/publications.js");
module.link("../../api/fundingcycles/server/methods.js");
module.link("../../api/fundingcycles/server/publications.js");
module.link("../../api/voting-power/server/publications.js");
module.link("../../api/transactions/server/methods.js");
module.link("../../api/transactions/server/publications.js");
module.link("../../api/delegations/server/methods.js");
module.link("../../api/delegations/server/publications.js");
module.link("../../api/status/server/publications.js");
module.link("../../api/accounts/server/methods.js");
module.link("../../api/coin-stats/server/methods.js");
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"util.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/startup/server/util.js                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let bech32;
module.link("bech32", {
  default(v) {
    bech32 = v;
  }

}, 0);
let HTTP;
module.link("meteor/http", {
  HTTP(v) {
    HTTP = v;
  }

}, 1);
let cheerio;
module.link("cheerio", {
  "*"(v) {
    cheerio = v;
  }

}, 2);

// Load future from fibers
var Future = Npm.require("fibers/future"); // Load exec


var exec = Npm.require("child_process").exec;

function toHexString(byteArray) {
  return byteArray.map(function (byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

Meteor.methods({
  pubkeyToBech32: function (pubkey, prefix) {
    // '1624DE6420' is ed25519 pubkey prefix
    let pubkeyAminoPrefix = Buffer.from('1624DE6420', 'hex');
    let buffer = Buffer.alloc(37);
    pubkeyAminoPrefix.copy(buffer, 0);
    Buffer.from(pubkey.value, 'base64').copy(buffer, pubkeyAminoPrefix.length);
    return bech32.encode(prefix, bech32.toWords(buffer));
  },
  bech32ToPubkey: function (pubkey) {
    // '1624DE6420' is ed25519 pubkey prefix
    let pubkeyAminoPrefix = Buffer.from('1624DE6420', 'hex');
    let buffer = Buffer.from(bech32.fromWords(bech32.decode(pubkey).words));
    return buffer.slice(pubkeyAminoPrefix.length).toString('base64');
  },
  getDelegator: function (operatorAddr) {
    let address = bech32.decode(operatorAddr);
    return bech32.encode(Meteor.settings.public.bech32PrefixAccAddr, address.words);
  },
  getKeybaseTeamPic: function (keybaseUrl) {
    let teamPage = HTTP.get(keybaseUrl);

    if (teamPage.statusCode == 200) {
      let page = cheerio.load(teamPage.content);
      return page(".kb-main-card img").attr('src');
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"ui":{"components":{"Icons.jsx":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// imports/ui/components/Icons.jsx                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  DenomSymbol: () => DenomSymbol,
  ProposalStatusIcon: () => ProposalStatusIcon,
  VoteIcon: () => VoteIcon,
  TxIcon: () => TxIcon
});
let React;
module.link("react", {
  default(v) {
    React = v;
  }

}, 0);
let i18n;
module.link("meteor/universe:i18n", {
  default(v) {
    i18n = v;
  }

}, 1);
const T = i18n.createComponent();

const DenomSymbol = props => {
  switch (props.denom) {
    case "steak":
      return '🥩';

    default:
      return '🍅';
  }
};

const ProposalStatusIcon = props => {
  switch (props.status) {
    case 'Passed':
      return React.createElement("i", {
        className: "fas fa-check-circle text-success"
      });

    case 'Rejected':
      return React.createElement("i", {
        className: "fas fa-times-circle text-danger"
      });

    case 'Removed':
      return React.createElement("i", {
        className: "fas fa-trash-alt text-dark"
      });

    case 'DepositPeriod':
      return React.createElement("i", {
        className: "fas fa-battery-half text-warning"
      });

    case 'VotingPeriod':
      return React.createElement("i", {
        className: "fas fa-hand-paper text-info"
      });

    default:
      return React.createElement("i", null);
  }
};

const VoteIcon = props => {
  switch (props.vote) {
    case 'yes':
      return React.createElement("i", {
        className: "fas fa-check text-success"
      });

    case 'no':
      return React.createElement("i", {
        className: "fas fa-times text-danger"
      });

    case 'abstain':
      return React.createElement("i", {
        className: "fas fa-user-slash text-warning"
      });

    case 'no_with_veto':
      return React.createElement("i", {
        className: "fas fa-exclamation-triangle text-info"
      });

    default:
      return React.createElement("i", null);
  }
};

const TxIcon = props => {
  if (props.valid) {
    return React.createElement("span", {
      className: "text-success text-nowrap"
    }, React.createElement("i", {
      className: "fas fa-check-circle"
    }, "Success"));
  } else {
    return React.createElement("span", {
      className: "text-danger text-nowrap"
    }, React.createElement("i", {
      className: "fas fa-times-circle"
    }, "Failed"));
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"both":{"i18n":{"en-us.i18n.yml.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// both/i18n/en-us.i18n.yml.js                                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Package['universe:i18n'].i18n.addTranslations('en-US','',{"common":{"height":"Height","voter":"Voter","votingPower":"Voting Power","addresses":"Addresses","amounts":"Amounts","delegators":"delegators","block":"block","blocks":"blocks","precommit":"precommit","precommits":"precommits","last":"last","backToList":"Back to List","information":"Information","time":"Time","hash":"Hash","more":"More","fullStop":".","searchPlaceholder":"Search with tx hash / block height / address"},"navbar":{"siteName":"Color","version":"beta","validators":"Validators","blocks":"Blocks","leagues":"Leagues","transactions":"Transactions","proposals":"Proposals","votingPower":"Voting Power","lang":"ENG","english":"English","chinese":"中文（繁）","simChinese":"中文（简）","license":"LICENSE","forkMe":"Fork me!"},"consensus":{"consensusState":"Consensus State","round":"Round","step":"Step"},"chainStates":{"price":"Price","marketCap":"Market Cap","inflation":"Inflation","deflation":"Deflation","minting":"Minting Speed","communityPool":"Community Pool"},"chainStatus":{"startMessage":"The chain is going to start in","stopWarning":"The chain appears to be stopped for <em>{$time}</em>! Feed me with new blocks 😭!","latestHeight":"Latest Block Height","averageBlockTime":"Best Block Time","all":"All","now":"Now","allTime":"All Time","lastMinute":"Last Minute","lastHour":"Last Hour","lastDay":"Last Day","seconds":"seconds","activeValidators":"Active Validators","outOfValidators":"out of {$totalValidators} validators","onlineVotingPower":"Online Voting Power","fromTotalStakes":"{$percent} from {$totalStakes} {$denom}"},"analytics":{"blockTimeHistory":"Block Time History","averageBlockTime":"Best Block Time","blockInterval":"Block Interval","noOfValidators":"No. of Validators"},"validators":{"randomValidators":"Random Validators","moniker":"Node Name","league":"League","uptime":"Uptime","selfPercentage":"Self%","commission":"Commission","lastSeen":"Last Seen","status":"Status","jailed":"Jailed","navActive":"Active","navInactive":"Inactive","active":"Active Validators","inactive":"Inactive Validators","listOfActive":"Here is a list of active validators.","listOfInactive":"Here is a list of inactive validators.","validatorDetails":"Validator Details","lastNumBlocks":"Last {$numBlocks} blocks","validatorInfo":"Validator Info","operatorAddress":"Operator Address","selfDelegationAddress":"Self-Delegate Address","commissionRate":"Commission Rate","maxRate":"Max Rate","maxChangeRate":"Max Change Rate","selfDelegationRatio":"Self Delegation Ratio","proposerPriority":"Proposer Priority","delegatorShares":"Delegator Shares","tokens":"Tokens","unbondingHeight":"Unbonding Height","unbondingTime":"Unbonding Time","powerChange":"Power Change","delegations":"Delegations","transactions":"Transactions","validatorNotExists":"Validator does not exist.","backToValidator":"Back to Validator","missedBlocks":"Missed Blocks","missedPrecommits":"Missed Precommits","missedBlocksTitle":"Missed blocks of {$moniker}","totalMissed":"Total missed","block":"Block","missedCount":"Miss Count","iDontMiss":"I do not miss ","lastSyncTime":"Last sync time","delegator":"Delegator","amount":"Amount","blocks":"blocks","precommits":"precommits","noOfValidators":"No. of Nodes"},"leagues":{"leagues":"Leagues","listOfLeagues":"Here is a list of Leagues","leagueDetails":"League Details"},"blocks":{"block":"Block","proposer":"Proposer","latestBlocks":"Latest blocks","noBlock":"No block.","numOfTxs":"No. of Txs","numOfTransactions":"No. of Transactions","notFound":"No such block found."},"transactions":{"transaction":"Transaction","transactions":"Transactions","notFound":"No transaction found.","activities":"Activities","txHash":"Tx Hash","valid":"Valid","fee":"Fee","amount":"Amount","type":"Type","time":"Time (UTC)","result":"Result","gasUsedWanted":"Gas (used / wanted)","noTxFound":"No such transaction found.","noValidatorTxsFound":"No transaction related to this validator was found.","memo":"Memo","transfer":"Transfer","staking":"Staking","distribution":"Distribution","governance":"Governance","slashing":"Slashing"},"fundingcycles":{"fundingcycles":"Funding Cycles","cycleID":"Cycle ID","cycleStartTime":"Cycle Start Time","cycleEndTime":"Cycle End Time","fundedproposals":"Funded Proposals"},"proposals":{"notFound":"No proposal found.","listOfProposals":"Here is a list of governance proposals.","proposer":"Proposer","rank":"Rank","proposal":"proposal","proposals":"Proposals","proposalID":"Proposal ID","title":"Title","status":"Status","submitTime":"Submit Time","depositEndTime":"Deposit End Time","votingStartTime":"Voting Start Time","votingEndTime":"End Voting Time","totalDeposit":"Total Deposit","fundingCycle":"Funding Cycle","requestedFund":"Requested Fund","description":"Description","proposalType":"Proposal Type","proposalStatus":"Proposal Status","notStarted":"not started","final":"final","deposit":"Deposit","tallyResult":"Tally Result","yes":"Yes","abstain":"Abstain","no":"No","noWithVeto":"No with Veto","percentageVoted":"<span class=\"text-info\">{$percent}</span> of online voting power has been voted.","validMessage":"This proposal is {$tentative}<strong>valid</strong>.","invalidMessage":"Less than {$quorum} of voting power is voted. This proposal is <strong>invalid</strong>.","moreVoteMessage":"It will be a valid proposal once <span class=\"text-info\">{$moreVotes}</span> more votes are casted."},"votingPower":{"distribution":"Voting Power Distribution","pareto":"Pareto Principle (20/80 rule)","minValidators34":"Min no. of validators hold 34%+ power"},"accounts":{"accountDetails":"Account Details","available":"Available","delegated":"Delegated","unbonding":"Unbonding","rewards":"Rewards","total":"Total","notFound":"This account does not exist. Are you looking for a wrong address?","validators":"Validators","shares":"Shares","mature":"Mature","no":"No ","delegation":"Delegation","plural":"s"},"activities":{"single":"A","happened":"happened.","senders":"The following sender(s)","sent":"sent","receivers":"to the following receipient(s)","received":"received","failedTo":"failed to ","to":"to","from":"from","operatingAt":"operating at","withMoniker":"with moniker","withTitle":"with title","withA":"with a"},"messageTypes":{"send":"Send","multiSend":"Multi Send","createValidator":"Create Validator","editValidator":"Edit Validator","delegate":"Delegate","undelegate":"Undelegate","redelegate":"Redelegate","submitProposal":"Submit Proposal","deposit":"Deposit","vote":"Vote","withdrawComission":"Withdraw Commission","withdrawReward":"Withdraw Reward","modifyWithdrawAddress":"Modify Withdraw Address","unjail":"Unjail","IBCTransfer":"IBC Transfer","IBCReceive":"IBC Receive"}});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"zh-hans.i18n.yml.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// both/i18n/zh-hans.i18n.yml.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Package['universe:i18n'].i18n.addTranslations('zh-Hans','',{"common":{"height":"高度","voter":"投票人","votingPower":"投票权","addresses":"地址","amounts":"数量","delegators":"委托人","block":"区块","blocks":"区块","precommit":"建块前保证","precommits":"建块前保证","last":"最后","backToList":"回到列表","information":"资讯","time":"时间","hash":"哈希","more":"更多","fullStop":"。","searchPlaceholder":"搜寻交易哈希 / 区块高度 / 地址"},"navbar":{"siteName":"北斗","version":"beta","validators":"验证人","blocks":"区块","transactions":"交易","proposals":"治理提案","votingPower":"投票权分布","lang":"中文（简）","english":"English","chinese":"中文（繁）","simChinese":"中文（简）","license":"LICENSE","forkMe":"Fork me!"},"consensus":{"consensusState":"共识状态","round":"轮数","step":"阶数"},"chainStates":{"price":"价格","marketCap":"市值","inflation":"通胀率","communityPool":"社区储备"},"chainStatus":{"startMessage":"这链将还有以下时间便会开始","stopWarning":"这链似乎已经停了 <em>{$time}</em>！ 请继续喂我吃新的区块 😭!","latestHeight":"最新区块高度","averageBlockTime":"平均区块时间","all":"全部","now":"現在","allTime":"全部","lastMinute":"前一分钟","lastHour":"前一小时","lastDay":"前一天","seconds":"秒","activeValidators":"有效验证人","outOfValidators":"来自总共 {$totalValidators} 个验证人","onlineVotingPower":"在线投票权","fromTotalStakes":"为 {$totalStakes} 颗 {$denom} 的 {$percent}"},"analytics":{"blockTimeHistory":"在线投票权","averageBlockTime":"Average Block Time","blockInterval":"Block Interval","noOfValidators":"No. of Validators"},"validators":{"randomValidators":"随机验证人","moniker":"验证人代号","uptime":"上线时间比重","selfPercentage":"自我委托%","commission":"佣金","lastSeen":"最后投票时间","status":"状态","jailed":"被禁制","navActive":"有效","navInactive":"无效","active":"有效验证人","inactive":"无效验证人","listOfActive":"这名单显示所有有效验证人","listOfInactive":"这名单显示所有无效验证人","validatorDetails":"验证人详情","lastNumBlocks":"最后 {$numBlocks} 个区块","validatorInfo":"验证人资讯","operatorAddress":"操作地址","selfDelegationAddress":"自我委托地址","commissionRate":"佣金","maxRate":"最大佣金限制","maxChangeRate":"每天最大佣金变化限制","selfDelegationRatio":"自我委托比列","proposerPriority":"建块优先权","delegatorShares":"委托股数","tokens":"代币数量","unbondingHeight":"解绑高度","unbondingTime":"解绑时间","powerChange":"投票权变更","delegations":"委托","transactions":"交易","validatorNotExists":"验证人不存在。","backToValidator":"回到验证人页面","missedBlocks":"错过了的区块","missedPrecommits":"遗留了的建块前保证","missedBlocksTitle":"错过了 {$moniker} 的区块","totalMissed":"一共错过了","block":"区块","missedCount":"错过数量","iDontMiss":"我不会错过任何一个","lastSyncTime":"上一次同步时间","delegator":"委托人","amount":"数量"},"blocks":{"proposer":"建块人","block":"区块","latestBlocks":"最近区块","noBlock":"没有区块。","numOfTxs":"交易数量","numOfTransactions":"交易数量","notFound":"没有这个区块。"},"transactions":{"transaction":"交易","transactions":"交易","notFound":"沒有交易。","activities":"活动","txHash":"交易哈希","valid":"有效","fee":"费用","gasUsedWanted":"瓦斯 (已用 / 要求)","noTxFound":"没有这笔交易。","noValidatorTxsFound":"没有跟这个验证人有关的交易","memo":"备忘录","transfer":"代币转移","staking":"委托","distribution":"收益分配","governance":"链上治理","slashing":"削减"},"proposals":{"notFound":"没有治理提案","listOfProposals":"这名单显示所有治理提案","proposer":"提案人","proposal":"治理提案","proposals":"治理提案","proposalID":"提案编号","title":"主题","status":"状态","submitTime":"提案时间","depositEndTime":"存入押金","votingStartTime":"投票开始时间","votingEndTime":"投票结束时间","totalDeposit":"押金总额","description":"详细内容","proposalType":"提案类型","proposalStatus":"提案状态","notStarted":"未开始","final":"最后结果","deposit":"押金","tallyResult":"投票结果","yes":"赞成","abstain":"弃权","no":"反对","noWithVeto":"强烈反对","percentageVoted":"现时在线投票权的投票率是 <span class=\"text-info\">{$percent}</span>。","validMessage":"这个提案 {$tentative} <strong>有效</strong>.","invalidMessage":"已投票的在线投票权少于 {$quorum}。这个提案 <strong>無效</strong>。","moreVoteMessage":"当再有多 <span class=\"text-info\">{$moreVotes}</span> 投票权投了票的话，这个提案将会有效。"},"votingPower":{"distribution":"投票权分布","pareto":"帕累托原则 (20/80 定率)","minValidators34":"最少合共有超过 34% 投票权的验证人"},"accounts":{"accountDetails":"帐户详情","available":"可用的","delegated":"委托中","unbonding":"解绑中","rewards":"未取回收益","total":"总共","notFound":"这个帐户不存在。你是否在查看一个错误的地址？","validators":"验证人","shares":"股数","mature":"成熟日期","no":"没有","delegation":"委托","plural":""},"activities":{"single":"一个","happened":"发生了","senders":"以下的帐户","sent":"发了","receivers":"到以下的帐户","received":"收到","failedTo":"未能","to":"到","from":"從","operatingAt":"操作地止为","withMoniker":"而验证人代号为","withTitle":"治理提案主题为","withA":"投了"},"messageTypes":{"send":"发送","multiSend":"多重发送","createValidator":"建立验证人","editValidator":"编辑验证人资料","delegate":"委托","undelegate":"解委托","redelegate":"转委托","submitProposal":"提交议案","deposit":"存入","vote":"投票","withdrawComission":"提取手续费","withdrawReward":"提取收益","modifyWithdrawAddress":"更改收益取回地址","unjail":"赦免","IBCTransfer":"IBC Transfer","IBCReceive":"IBC Receive"}});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"zh-hant.i18n.yml.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// both/i18n/zh-hant.i18n.yml.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Package['universe:i18n'].i18n.addTranslations('zh-Hant','',{"common":{"height":"高度","voter":"投票人","votingPower":"投票權","addresses":"地址","amounts":"數量","delegators":"委托人","block":"區塊","blocks":"區塊","precommit":"建塊前保證","precommits":"建塊前保證","last":"最後","backToList":"回到列表","information":"資訊","time":"時間","hash":"哈希","more":"更多","fullStop":"。","searchPlaceholder":"搜尋交易哈希 / 區塊高度 / 地址"},"navbar":{"siteName":"北斗","version":"beta","validators":"驗證人","blocks":"區塊","transactions":"交易","proposals":"治理提案","votingPower":"投票權分佈","lang":"中文（繁）","english":"English","chinese":"中文（繁）","simChinese":"中文（简）","license":"LICENSE","forkMe":"Fork me!"},"consensus":{"consensusState":"共識狀態","round":"輪數","step":"階數"},"chainStates":{"price":"價格","marketCap":"市值","inflation":"通漲率","communityPool":"社區儲備"},"chainStatus":{"startMessage":"這鏈將還有以下時間便會開始","stopWarning":"這鏈似乎已經停了 <em>{$time}</em>！ 請繼續餵我吃新的區塊 😭!","latestHeight":"最新區塊高度","averageBlockTime":"平均區塊時間","all":"全部","now":"現在","allTime":"全部","lastMinute":"前一分鐘","lastHour":"前一小時","lastDay":"前一天","seconds":"秒","activeValidators":"有效驗證人","outOfValidators":"來自總共 {$totalValidators} 個驗證人","onlineVotingPower":"在線投票權","fromTotalStakes":"為 {$totalStakes} 顆 {$denom} 的 {$percent}"},"analytics":{"blockTimeHistory":"在線投票權","averageBlockTime":"Average Block Time","blockInterval":"Block Interval","noOfValidators":"No. of Validators"},"validators":{"randomValidators":"隨機驗證人","moniker":"驗證人代號","uptime":"上線時間比重","selfPercentage":"自我委托%","commission":"佣金","lastSeen":"最後投票時間","status":"狀態","jailed":"被禁制","navActive":"有效","navInactive":"無效","active":"有效驗證人","inactive":"無效驗證人","listOfActive":"這名單顯示所有有效驗證人","listOfInactive":"這名單顯示所有無效驗證人","validatorDetails":"驗證人詳情","lastNumBlocks":"最後 {$numBlocks} 個區塊","validatorInfo":"驗證人資訊","operatorAddress":"操作地址","selfDelegationAddress":"自我委托地址","commissionRate":"佣金","maxRate":"最大佣金限制","maxChangeRate":"每天最大佣金變化限制","selfDelegationRatio":"自我委托比列","proposerPriority":"建塊優先權","delegatorShares":"委托股數","tokens":"代幣數量","unbondingHeight":"解綁高度","unbondingTime":"解綁時間","powerChange":"投票權變更","delegations":"委托","transactions":"交易","validatorNotExists":"驗證人不存在。","backToValidator":"回到驗證人頁面","missedBlocks":"錯過了的區塊","missedPrecommits":"遺留了的建塊前保證","missedBlocksTitle":"錯過了 {$moniker} 的區塊","totalMissed":"一共錯過了","block":"區塊","missedCount":"錯過數量","iDontMiss":"我不會錯過任何一個","lastSyncTime":"上一次同步時間","delegator":"委托人","amount":"數量"},"blocks":{"proposer":"建塊人","block":"區塊","latestBlocks":"最近區塊","noBlock":"沒有區塊。","numOfTxs":"交易數量","numOfTransactions":"交易數量","notFound":"沒有這個區塊。"},"transactions":{"transaction":"交易","transactions":"交易","notFound":"沒有交易。","activities":"活動","txHash":"交易哈希","valid":"有效","fee":"費用","gasUsedWanted":"瓦斯 (已用 / 要求)","noTxFound":"沒有這筆交易。","noValidatorTxsFound":"沒有跟這個驗證人有關的交易","memo":"備忘錄","transfer":"代幣轉移","staking":"委托","distribution":"收益分配","governance":"鏈上治理","slashing":"削減"},"proposals":{"notFound":"沒有治理提案","listOfProposals":"這名單顯示所有治理提案","proposer":"提案人","proposal":"治理提案","proposals":"治理提案","proposalID":"提案編號","title":"主題","status":"狀態","submitTime":"提案時間","depositEndTime":"存入押金","votingStartTime":"投票開始時間","votingEndTime":"投票結束時間","totalDeposit":"押金總額","description":"詳細內容","proposalType":"提案類型","proposalStatus":"提案狀態","notStarted":"未開始","final":"最後結果","deposit":"押金","tallyResult":"投票結果","yes":"贊成","abstain":"棄權","no":"反對","noWithVeto":"強烈反對","percentageVoted":"現時在線投票權的投票率是 <span class=\"text-info\">{$percent}</span>。","validMessage":"這個提案 {$tentative} <strong>有效</strong>.","invalidMessage":"已投票的在線投票權少於 {$quorum}。這個 <strong>無效</strong>。","moreVoteMessage":"當再有多 <span class=\"text-info\">{$moreVotes}</span> 投票權投了票的話，這個提案將會有效。"},"votingPower":{"distribution":"投票權分佈","pareto":"帕累托原則 (20/80 定率)","minValidators34":"最少合共有超過 34% 投票權的驗證人"},"accounts":{"accountDetails":"帳戶詳情","available":"可用的","delegated":"委托中","unbonding":"解綁中","rewards":"未取回收益","total":"總共","notFound":"這個帳戶不存在。你是否在查看一個錯誤的地址？","validators":"驗證人","shares":"股數","mature":"成熟日期","no":"沒有","delegation":"委托","plural":""},"activities":{"single":"一個","happened":"發生了","senders":"以下的帳戶","sent":"發了","receivers":"到以下的帳戶","received":"收到","failedTo":"未能","to":"到","from":"從","operatingAt":"操作地止為","withMoniker":"而驗證人代號為","withTitle":"治理提案主題為","withA":"投了"},"messageTypes":{"send":"發送","multiSend":"多重發送","createValidator":"建立驗證人","editValidator":"編輯驗證人資料","delegate":"委托","undelegate":"解委托","redelegate":"轉委托","submitProposal":"提交議案","deposit":"存入","vote":"投票","withdrawComission":"提取手續費","withdrawReward":"提取收益","modifyWithdrawAddress":"更改收益取回地址","unjail":"赦免","IBCTransfer":"IBC Transfer","IBCReceive":"IBC Receive"}});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"utils":{"coins.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// both/utils/coins.js                                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => Coin
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let numbro;
module.link("numbro", {
  default(v) {
    numbro = v;
  }

}, 1);

autoformat = value => {
  let formatter = '0,0.0000';
  value = Math.round(value * 1000) / 1000;
  if (Math.round(value) === value) formatter = '0,0';else if (Math.round(value * 10) === value * 10) formatter = '0,0.0';else if (Math.round(value * 100) === value * 100) formatter = '0,0.00';else if (Math.round(value * 1000) === value * 1000) formatter = '0,0.000';
  return numbro(value).format(formatter);
};

class Coin {
  constructor(amount, denom = null) {
    if (typeof amount === 'object') ({
      amount,
      denom
    } = amount);

    if (!denom || denom.toLowerCase() === Coin.MintingDenom) {
      this._amount = Number(amount);
    } else if (denom.toLowerCase() === Coin.StakingDenom) {
      this._amount = Number(amount) * Coin.StakingFraction;
    } else {
      throw Error(`unsupported denom ${denom}`);
    }
  }

  get amount() {
    return this._amount;
  }

  get stakingAmount() {
    return this._amount;
  }

  toString(precision) {
    // default to display in mint denom if it has more than 4 decimal places
    let minStake = Coin.StakingFraction / (precision ? Math.pow(10, precision) : 10000);

    if (this.amount < minStake) {
      return `${numbro(this.amount).format('0,0')} ${Coin.MintingDenom}`;
    } else {
      return `${precision ? numbro(this.stakingAmount).format('0,0.' + '0'.repeat(precision)) : autoformat(this.stakingAmount)} ${Coin.MintingDenom}`;
    }
  }

  mintString(formatter) {
    let amount = this.amount;

    if (formatter) {
      amount = numbro(amount).format(formatter);
    }

    return `${amount} ${Coin.MintingDenom}`;
  }

  stakeString(formatter) {
    let amount = this.stakingAmount;

    if (formatter) {
      amount = numbro(amount).format(formatter);
    }

    return `${amount} ${Coin.MintingDenom}`;
  }

}

Coin.StakingDenom = Meteor.settings.public.stakingDenom.toLowerCase();
Coin.MintingDenom = Meteor.settings.public.mintingDenom.toLowerCase();
Coin.StakingFraction = Number(Meteor.settings.public.stakingFraction);
Coin.MinStake = 1 / Number(Meteor.settings.public.stakingFraction);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"main.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// server/main.js                                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.link("/imports/startup/server");
module.link("/imports/startup/both");
// import moment from 'moment';
// import '/imports/api/blocks/blocks.js';
SYNCING = false;
COUNTMISSEDBLOCKS = false;
RPC = Meteor.settings.remote.rpc;
LCD = Meteor.settings.remote.lcd;
timerBlocks = 0;
timerChain = 0;
timerConsensus = 0;
timerProposal = 0;
timerFundingCycle = 0;
timerProposalsResults = 0;
timerMissedBlock = 0;
timerDelegation = 0;
timerAggregate = 0;

updateChainStatus = () => {
  Meteor.call('chain.updateStatus', (error, result) => {
    if (error) {
      console.log("updateStatus: " + error);
    } else {
      console.log("updateStatus: " + result);
    }
  });
};

updateBlock = () => {
  Meteor.call('blocks.blocksUpdate', (error, result) => {
    if (error) {
      console.log("updateBlocks: " + error);
    } else {
      console.log("updateBlocks: " + result);
    }
  });
};

getConsensusState = () => {
  Meteor.call('chain.getConsensusState', (error, result) => {
    if (error) {
      console.log("get consensus: " + error);
    }
  });
};

getProposals = () => {
  Meteor.call('proposals.getProposals', (error, result) => {
    if (error) {
      console.log("get proposal: " + error);
    }

    if (result) {
      console.log("get proposal: " + result);
    }
  });
};

getFundingCycles = () => {
  Meteor.call('FundingCycles.getFundingCycles', (error, result) => {
    if (error) {
      console.log("get Funding Cycle: " + error);
    }

    if (result) {
      console.log("get Funding Cycle: " + result);
    }
  });
};

getProposalsResults = () => {
  Meteor.call('proposals.getProposalResults', (error, result) => {
    if (error) {
      console.log("get proposals result: " + error);
    }

    if (result) {
      console.log("get proposals result: " + result);
    }
  });
};

updateMissedBlockStats = () => {
  Meteor.call('ValidatorRecords.calculateMissedBlocks', (error, result) => {
    if (error) {
      console.log("missblocks error: " + error);
    }

    if (result) {
      console.log("missed blocks ok:" + result);
    }
  });
};

getDelegations = () => {
  Meteor.call('delegations.getDelegations', (error, result) => {
    if (error) {
      console.log("get delegation error: " + error);
    } else {
      console.log("get delegtaions ok: " + result);
    }
  });
};

aggregateMinutely = () => {
  // doing something every min
  Meteor.call('Analytics.aggregateBlockTimeAndVotingPower', "m", (error, result) => {
    if (error) {
      console.log("aggregate minutely block time error: " + error);
    } else {
      console.log("aggregate minutely block time ok: " + result);
    }
  });
  Meteor.call('coinStats.getCoinStats', (error, result) => {
    if (error) {
      console.log("get coin stats: " + error);
    } else {
      console.log("get coin stats ok: " + result);
    }
  });
};

aggregateHourly = () => {
  // doing something every hour
  Meteor.call('Analytics.aggregateBlockTimeAndVotingPower', "h", (error, result) => {
    if (error) {
      console.log("aggregate hourly block time error: " + error);
    } else {
      console.log("aggregate hourly block time ok: " + result);
    }
  });
};

aggregateDaily = () => {
  // doing somthing every day
  Meteor.call('Analytics.aggregateBlockTimeAndVotingPower', "d", (error, result) => {
    if (error) {
      console.log("aggregate daily block time error: " + error);
    } else {
      console.log("aggregate daily block time ok: " + result);
    }
  });
  Meteor.call('Analytics.aggregateValidatorDailyBlockTime', (error, result) => {
    if (error) {
      console.log("aggregate validators block time error:" + error);
    } else {
      console.log("aggregate validators block time ok:" + result);
    }
  });
};

Meteor.startup(function () {
  if (Meteor.isDevelopment) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
  }

  Meteor.call('chain.genesis', (err, result) => {
    if (err) {
      console.log(err);
    }

    if (result) {
      if (Meteor.settings.debug.startTimer) {
        timerConsensus = Meteor.setInterval(function () {
          getConsensusState();
        }, Meteor.settings.params.consensusInterval);
        timerBlocks = Meteor.setInterval(function () {
          updateBlock();
        }, Meteor.settings.params.blockInterval);
        timerChain = Meteor.setInterval(function () {
          updateChainStatus();
        }, Meteor.settings.params.statusInterval);
        timerProposal = Meteor.setInterval(function () {
          getProposals();
        }, Meteor.settings.params.proposalInterval);
        timerFundingCycle = Meteor.setInterval(function () {
          getFundingCycles();
        }, Meteor.settings.params.fundingCycleInterval);
        timerProposalsResults = Meteor.setInterval(function () {
          getProposalsResults();
        }, Meteor.settings.params.proposalInterval);
        timerMissedBlock = Meteor.setInterval(function () {
          updateMissedBlockStats();
        }, Meteor.settings.params.missedBlocksInterval);
        timerDelegation = Meteor.setInterval(function () {
          getDelegations();
        }, Meteor.settings.params.delegationInterval);
        timerAggregate = Meteor.setInterval(function () {
          let now = new Date();

          if (now.getUTCSeconds() == 0) {
            aggregateMinutely();
          }

          if (now.getUTCMinutes() == 0 && now.getUTCSeconds() == 0) {
            aggregateHourly();
          }

          if (now.getUTCHours() == 0 && now.getUTCMinutes() == 0 && now.getUTCSeconds() == 0) {
            aggregateDaily();
          }
        }, 1000);
      }
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json",
    ".jsx",
    ".i18n.yml"
  ]
});

require("/both/i18n/en-us.i18n.yml.js");
require("/both/i18n/zh-hans.i18n.yml.js");
require("/both/i18n/zh-hant.i18n.yml.js");
require("/both/utils/coins.js");
require("/server/main.js");
//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvYWNjb3VudHMvc2VydmVyL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2Jsb2Nrcy9zZXJ2ZXIvbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvYmxvY2tzL3NlcnZlci9wdWJsaWNhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2Jsb2Nrcy9ibG9ja3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2NoYWluL3NlcnZlci9tZXRob2RzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9jaGFpbi9zZXJ2ZXIvcHVibGljYXRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9jaGFpbi9jaGFpbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvY29pbi1zdGF0cy9zZXJ2ZXIvbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvY29pbi1zdGF0cy9jb2luLXN0YXRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9kZWxlZ2F0aW9ucy9zZXJ2ZXIvbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvZGVsZWdhdGlvbnMvZGVsZWdhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2Z1bmRpbmdjeWNsZXMvc2VydmVyL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2Z1bmRpbmdjeWNsZXMvc2VydmVyL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvZnVuZGluZ2N5Y2xlcy9mdW5kaW5nY3ljbGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9wcm9wb3NhbHMvc2VydmVyL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3Byb3Bvc2Fscy9zZXJ2ZXIvcHVibGljYXRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9wcm9wb3NhbHMvcHJvcG9zYWxzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9yZWNvcmRzL3NlcnZlci9tZXRob2RzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9yZWNvcmRzL3NlcnZlci9wdWJsaWNhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3JlY29yZHMvcmVjb3Jkcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvc3RhdHVzL3NlcnZlci9wdWJsaWNhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3N0YXR1cy9zdGF0dXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3RyYW5zYWN0aW9ucy9zZXJ2ZXIvbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvdHJhbnNhY3Rpb25zL3NlcnZlci9wdWJsaWNhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3RyYW5zYWN0aW9ucy90cmFuc2FjdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ZhbGlkYXRvcnMvc2VydmVyL21ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL3ZhbGlkYXRvcnMvc2VydmVyL3B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvdmFsaWRhdG9ycy92YWxpZGF0b3JzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS92b3RpbmctcG93ZXIvaGlzdG9yeS5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvZXZpZGVuY2VzL2V2aWRlbmNlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvdmFsaWRhdG9yLXNldHMvdmFsaWRhdG9yLXNldHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvc3RhcnR1cC9ib3RoL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyL2NyZWF0ZS1pbmRleGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyL3JlZ2lzdGVyLWFwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9zdGFydHVwL3NlcnZlci91dGlsLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3VpL2NvbXBvbmVudHMvSWNvbnMuanN4IiwibWV0ZW9yOi8v8J+Su2FwcC9ib3RoL3V0aWxzL2NvaW5zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWFpbi5qcyJdLCJuYW1lcyI6WyJNZXRlb3IiLCJtb2R1bGUiLCJsaW5rIiwidiIsIkhUVFAiLCJtZXRob2RzIiwiYWRkcmVzcyIsInVuYmxvY2siLCJiYWxhbmNlIiwidXJsIiwiTENEIiwiYXZhaWxhYmxlIiwiZ2V0Iiwic3RhdHVzQ29kZSIsIkpTT04iLCJwYXJzZSIsImNvbnRlbnQiLCJsZW5ndGgiLCJlIiwiY29uc29sZSIsImxvZyIsImRlbGVnYXRpb25zIiwidW5ib25kaW5nIiwicmV3YXJkcyIsImZvckVhY2giLCJkZWxlZ2F0aW9uIiwiaSIsInNoYXJlcyIsInBhcnNlRmxvYXQiLCJ1bmJvbmRpbmdzIiwiUHJvbWlzZSIsIkJsb2Nrc2NvbiIsIkNoYWluIiwiVmFsaWRhdG9yU2V0cyIsIlZhbGlkYXRvcnMiLCJWYWxpZGF0b3JSZWNvcmRzIiwiQW5hbHl0aWNzIiwiVlBEaXN0cmlidXRpb25zIiwiVm90aW5nUG93ZXJIaXN0b3J5IiwiVHJhbnNhY3Rpb25zIiwiRXZpZGVuY2VzIiwic2hhMjU2IiwiZ2V0QWRkcmVzcyIsImdldFJlbW92ZWRWYWxpZGF0b3JzIiwicHJldlZhbGlkYXRvcnMiLCJ2YWxpZGF0b3JzIiwicCIsInNwbGljZSIsImJsb2NrcyIsImZpbmQiLCJwcm9wb3NlckFkZHJlc3MiLCJmZXRjaCIsImhlaWdodHMiLCJtYXAiLCJibG9jayIsImhlaWdodCIsImJsb2Nrc1N0YXRzIiwiJGluIiwidG90YWxCbG9ja0RpZmYiLCJiIiwidGltZURpZmYiLCJjb2xsZWN0aW9uIiwicmF3Q29sbGVjdGlvbiIsInBpcGVsaW5lIiwiJG1hdGNoIiwiJHNvcnQiLCIkbGltaXQiLCJzZXR0aW5ncyIsInB1YmxpYyIsInVwdGltZVdpbmRvdyIsIiR1bndpbmQiLCIkZ3JvdXAiLCIkY29uZCIsIiRlcSIsImF3YWl0IiwiYWdncmVnYXRlIiwidG9BcnJheSIsIlJQQyIsInJlc3BvbnNlIiwic3RhdHVzIiwicmVzdWx0Iiwic3luY19pbmZvIiwibGF0ZXN0X2Jsb2NrX2hlaWdodCIsImN1cnJIZWlnaHQiLCJzb3J0IiwibGltaXQiLCJwYXJhbXMiLCJzdGFydEhlaWdodCIsIlNZTkNJTkciLCJ1bnRpbCIsImNhbGwiLCJjdXJyIiwidmFsaWRhdG9yU2V0Iiwic3RhcnRCbG9ja1RpbWUiLCJEYXRlIiwiYW5hbHl0aWNzRGF0YSIsImJ1bGtWYWxpZGF0b3JzIiwiaW5pdGlhbGl6ZVVub3JkZXJlZEJ1bGtPcCIsImJ1bGtWYWxpZGF0b3JSZWNvcmRzIiwiYnVsa1ZQSGlzdG9yeSIsImJ1bGtUcmFuc2F0aW9ucyIsInN0YXJ0R2V0SGVpZ2h0VGltZSIsImJsb2NrRGF0YSIsImhhc2giLCJibG9ja19tZXRhIiwiYmxvY2tfaWQiLCJ0cmFuc051bSIsImhlYWRlciIsIm51bV90eHMiLCJ0aW1lIiwibGFzdEJsb2NrSGFzaCIsImxhc3RfYmxvY2tfaWQiLCJwcm9wb3Nlcl9hZGRyZXNzIiwicHJlY29tbWl0cyIsImxhc3RfY29tbWl0IiwicHVzaCIsInZhbGlkYXRvcl9hZGRyZXNzIiwiZGF0YSIsInR4cyIsInQiLCJCdWZmZXIiLCJmcm9tIiwiZXJyIiwiZXZpZGVuY2UiLCJpbnNlcnQiLCJwcmVjb21taXRzQ291bnQiLCJlbmRHZXRIZWlnaHRUaW1lIiwic3RhcnRHZXRWYWxpZGF0b3JzVGltZSIsImJsb2NrX2hlaWdodCIsInBhcnNlSW50IiwidmFsaWRhdG9yc0NvdW50Iiwic3RhcnRCbG9ja0luc2VydFRpbWUiLCJlbmRCbG9ja0luc2VydFRpbWUiLCJleGlzdGluZ1ZhbGlkYXRvcnMiLCIkZXhpc3RzIiwicmVjb3JkIiwiZXhpc3RzIiwidm90aW5nX3Bvd2VyIiwiaiIsIm51bUJsb2NrcyIsInVwdGltZSIsImJhc2UiLCJ1cHNlcnQiLCJ1cGRhdGVPbmUiLCIkc2V0IiwibGFzdFNlZW4iLCJjaGFpblN0YXR1cyIsImZpbmRPbmUiLCJjaGFpbklkIiwiY2hhaW5faWQiLCJsYXN0U3luY2VkVGltZSIsImJsb2NrVGltZSIsImRlZmF1bHRCbG9ja1RpbWUiLCJkYXRlTGF0ZXN0IiwiZGF0ZUxhc3QiLCJNYXRoIiwiYWJzIiwiZ2V0VGltZSIsImVuZEdldFZhbGlkYXRvcnNUaW1lIiwidXBkYXRlIiwiYXZlcmFnZUJsb2NrVGltZSIsInN0YXJ0RmluZFZhbGlkYXRvcnNOYW1lVGltZSIsInZhbGlkYXRvciIsInByb3Bvc2VyX3ByaW9yaXR5IiwidmFsRXhpc3QiLCJwdWJfa2V5IiwidmFsdWUiLCJhY2NwdWIiLCJiZWNoMzJQcmVmaXhBY2NQdWIiLCJvcGVyYXRvcl9wdWJrZXkiLCJiZWNoMzJQcmVmaXhWYWxQdWIiLCJjb25zZW5zdXNfcHVia2V5IiwiYmVjaDMyUHJlZml4Q29uc1B1YiIsInZhbCIsIm9wZXJhdG9yX2FkZHJlc3MiLCJkZWxlZ2F0b3JfYWRkcmVzcyIsImphaWxlZCIsIm1pbl9zZWxmX2RlbGVnYXRpb24iLCJ0b2tlbnMiLCJsZWFndWUiLCJkZWxlZ2F0b3Jfc2hhcmVzIiwiZGVzY3JpcHRpb24iLCJib25kX2hlaWdodCIsImJvbmRfaW50cmFfdHhfY291bnRlciIsInVuYm9uZGluZ19oZWlnaHQiLCJ1bmJvbmRpbmdfdGltZSIsImNvbW1pc3Npb24iLCJzZWxmX2RlbGVnYXRpb24iLCJwcmV2X3ZvdGluZ19wb3dlciIsInR5cGUiLCJibG9ja190aW1lIiwic2VsZkRlbGVnYXRpb24iLCJwcmV2Vm90aW5nUG93ZXIiLCJjaGFuZ2VUeXBlIiwiY2hhbmdlRGF0YSIsInJlbW92ZWRWYWxpZGF0b3JzIiwiciIsImVuZEZpbmRWYWxpZGF0b3JzTmFtZVRpbWUiLCJzdGFydEFuYXl0aWNzSW5zZXJ0VGltZSIsImVuZEFuYWx5dGljc0luc2VydFRpbWUiLCJzdGFydFZVcFRpbWUiLCJleGVjdXRlIiwiZW5kVlVwVGltZSIsInN0YXJ0VlJUaW1lIiwiZW5kVlJUaW1lIiwiYWN0aXZlVmFsaWRhdG9ycyIsIm51bVRvcFR3ZW50eSIsImNlaWwiLCJudW1Cb3R0b21FaWdodHkiLCJ0b3BUd2VudHlQb3dlciIsImJvdHRvbUVpZ2h0eVBvd2VyIiwibnVtVG9wVGhpcnR5Rm91ciIsIm51bUJvdHRvbVNpeHR5U2l4IiwidG9wVGhpcnR5Rm91clBlcmNlbnQiLCJib3R0b21TaXh0eVNpeFBlcmNlbnQiLCJ2cERpc3QiLCJudW1WYWxpZGF0b3JzIiwidG90YWxWb3RpbmdQb3dlciIsImNyZWF0ZUF0IiwiZW5kQmxvY2tUaW1lIiwibGFzdEJsb2Nrc1N5bmNlZFRpbWUiLCJ0b3RhbFZhbGlkYXRvcnMiLCJwdWJsaXNoQ29tcG9zaXRlIiwiY2hpbGRyZW4iLCJleHBvcnQiLCJNb25nbyIsIkNvbGxlY3Rpb24iLCJoZWxwZXJzIiwicHJvcG9zZXIiLCJDaGFpblN0YXRlcyIsImZpbmRWb3RpbmdQb3dlciIsImdlblZhbGlkYXRvcnMiLCJwb3dlciIsImNvbnNlbnN1cyIsInJvdW5kX3N0YXRlIiwicm91bmQiLCJzdGVwIiwidm90ZWRQb3dlciIsInZvdGVzIiwicHJldm90ZXNfYml0X2FycmF5Iiwic3BsaXQiLCJ2b3RpbmdIZWlnaHQiLCJ2b3RpbmdSb3VuZCIsInZvdGluZ1N0ZXAiLCJwcmV2b3RlcyIsImNoYWluIiwibm9kZV9pbmZvIiwibmV0d29yayIsImxhdGVzdEJsb2NrSGVpZ2h0IiwibGF0ZXN0QmxvY2tUaW1lIiwibGF0ZXN0X2Jsb2NrX3RpbWUiLCJhY3RpdmVWUCIsImFjdGl2ZVZvdGluZ1Bvd2VyIiwiY2hhaW5TdGF0ZXMiLCJib25kaW5nIiwiYm9uZGVkVG9rZW5zIiwiYm9uZGVkX3Rva2VucyIsIm5vdEJvbmRlZFRva2VucyIsIm5vdF9ib25kZWRfdG9rZW5zIiwicG9vbCIsImNvbW11bml0eVBvb2wiLCJhbW91bnQiLCJkZW5vbSIsImluZmxhdGlvbiIsImRlZmxhdGlvbiIsIm1pbnRpbmciLCJwcm92aXNpb25zIiwiYW5udWFsUHJvdmlzaW9ucyIsImNyZWF0ZWQiLCJyZWFkR2VuZXNpcyIsImdlbmVzaXNGaWxlIiwiZ2VuZXNpcyIsImNoYWluUGFyYW1zIiwiZ2VuZXNpc1RpbWUiLCJnZW5lc2lzX3RpbWUiLCJjb25zZW5zdXNQYXJhbXMiLCJjb25zZW5zdXNfcGFyYW1zIiwiYXV0aCIsImFwcF9zdGF0ZSIsImJhbmsiLCJzdGFraW5nIiwibWludCIsImRpc3RyIiwiY29tbXVuaXR5VGF4IiwiY29tbXVuaXR5X3RheCIsImJhc2VQcm9wb3NlclJld2FyZCIsImJhc2VfcHJvcG9zZXJfcmV3YXJkIiwiYm9udXNQcm9wb3NlclJld2FyZCIsImJvbnVzX3Byb3Bvc2VyX3Jld2FyZCIsIndpdGhkcmF3QWRkckVuYWJsZWQiLCJ3aXRoZHJhd19hZGRyX2VuYWJsZWQiLCJnb3YiLCJzdGFydGluZ1Byb3Bvc2FsSWQiLCJzdGFydGluZ19wcm9wb3NhbF9pZCIsImRlcG9zaXRQYXJhbXMiLCJkZXBvc2l0X3BhcmFtcyIsInZvdGluZ1BhcmFtcyIsInZvdGluZ19wYXJhbXMiLCJ0YWxseVBhcmFtcyIsInRhbGx5X3BhcmFtcyIsInNsYXNoaW5nIiwiZ2VudHhzIiwibXNnIiwibSIsInB1YmtleSIsImZsb29yIiwic3Rha2luZ0ZyYWN0aW9uIiwicHVia2V5VmFsdWUiLCJnZW5WYWxpZGF0b3JzU2V0IiwiQ29pblN0YXRzIiwicHVibGlzaCIsImxhc3RfdXBkYXRlZF9hdCIsImZpZWxkcyIsImNvaW5JZCIsImNvaW5nZWNrb0lkIiwibm93Iiwic2V0TWludXRlcyIsIkRlbGVnYXRpb25zIiwiY29uY2F0IiwiY3JlYXRlZEF0IiwiRnVuZGluZ0N5Y2xlc3MiLCJGdW5kaW5nQ3ljbGVzIiwiRnVuZGluZ0N5Y2xlSWRzIiwiYnVsa0Z1bmRpbmdDeWNsZXMiLCJGdW5kaW5nQ3ljbGUiLCJjeWNsZUlkIiwiY3ljbGVfaWQiLCJjaGVjayIsImlkIiwiTnVtYmVyIiwiUHJvcG9zYWxzIiwicHJvcG9zYWxzIiwicHJvcG9zYWxJZHMiLCJidWxrUHJvcG9zYWxzIiwicHJvcG9zYWwiLCJwcm9wb3NhbElkIiwicHJvcG9zYWxfaWQiLCIkbmluIiwiZGVwb3NpdHMiLCJnZXRWb3RlRGV0YWlsIiwidGFsbHkiLCJ1cGRhdGVkQXQiLCJ2b3RlcnMiLCJ2b3RlIiwidm90ZXIiLCJ2b3RpbmdQb3dlck1hcCIsInZhbGlkYXRvckFkZHJlc3NNYXAiLCJtb25pa2VyIiwiZGVsZWdhdG9yU2hhcmVzIiwiZGVkdWN0ZWRTaGFyZXMiLCJ2b3RpbmdQb3dlciIsInVuZGVmaW5lZCIsIkF2ZXJhZ2VEYXRhIiwiQXZlcmFnZVZhbGlkYXRvckRhdGEiLCJTdGF0dXMiLCJNaXNzZWRCbG9ja3NTdGF0cyIsImNvdW50IiwiQ09VTlRNSVNTRURCTE9DS1MiLCJsYXRlc3RIZWlnaHQiLCJleHBsb3JlclN0YXR1cyIsImxhc3RNaXNzZWRCbG9ja0hlaWdodCIsImJ1bGtNaXNzZWRTdGF0cyIsInZvdGVyQWRkcmVzcyIsIm1pc3NlZFJlY29yZHMiLCIkYW5kIiwiJGd0IiwiJGx0ZSIsImNvdW50cyIsImV4aXN0aW5nUmVjb3JkIiwiYmluZEVudmlyb25tZW50IiwibGFzdE1pc3NlZEJsb2NrVGltZSIsImF2ZXJhZ2VWb3RpbmdQb3dlciIsImFuYWx5dGljcyIsImxhc3RNaW51dGVWb3RpbmdQb3dlciIsImxhc3RNaW51dGVCbG9ja1RpbWUiLCJsYXN0SG91clZvdGluZ1Bvd2VyIiwibGFzdEhvdXJCbG9ja1RpbWUiLCJsYXN0RGF5Vm90aW5nUG93ZXIiLCJsYXN0RGF5QmxvY2tUaW1lIiwiYmxvY2tIZWlnaHRzIiwiYSIsIm51bSIsImNvbmRpdGlvbnMiLCJzdGF0cyIsInByb3Bvc2VyTW9uaWtlciIsInZvdGVyTW9uaWtlciIsInRvVXBwZXJDYXNlIiwidHgiLCJ0eElkIiwiJG9yIiwiJGx0IiwiaW5jbHVkZXMiLCJiZWNoMzJQcmVmaXhWYWxBZGRyIiwiYmVjaDMyUHJlZml4QWNjQWRkciIsInZhbGlkYXRvckFkZHJlc3MiLCJkZWxlZ2F0b3JBZGRyZXNzIiwicXVlcnkiLCJ0eGhhc2giLCJUeEljb24iLCJjb2RlIiwiZGlyZWN0aW9uIiwib3B0aW9ucyIsImluZGV4T2YiLCJmaXJzdFNlZW4iLCJoaXN0b3J5IiwiY3JlYXRlSW5kZXgiLCJ1bmlxdWUiLCJwYXJ0aWFsRmlsdGVyRXhwcmVzc2lvbiIsIm9uUGFnZUxvYWQiLCJIZWxtZXQiLCJzaW5rIiwiaGVsbWV0IiwicmVuZGVyU3RhdGljIiwiYXBwZW5kVG9IZWFkIiwibWV0YSIsInRvU3RyaW5nIiwidGl0bGUiLCJiZWNoMzIiLCJkZWZhdWx0IiwiY2hlZXJpbyIsIkZ1dHVyZSIsIk5wbSIsInJlcXVpcmUiLCJleGVjIiwidG9IZXhTdHJpbmciLCJieXRlQXJyYXkiLCJieXRlIiwic2xpY2UiLCJqb2luIiwicHVia2V5VG9CZWNoMzIiLCJwcmVmaXgiLCJwdWJrZXlBbWlub1ByZWZpeCIsImJ1ZmZlciIsImFsbG9jIiwiY29weSIsImVuY29kZSIsInRvV29yZHMiLCJiZWNoMzJUb1B1YmtleSIsImZyb21Xb3JkcyIsImRlY29kZSIsIndvcmRzIiwiZ2V0RGVsZWdhdG9yIiwib3BlcmF0b3JBZGRyIiwiZ2V0S2V5YmFzZVRlYW1QaWMiLCJrZXliYXNlVXJsIiwidGVhbVBhZ2UiLCJwYWdlIiwibG9hZCIsImF0dHIiLCJEZW5vbVN5bWJvbCIsIlByb3Bvc2FsU3RhdHVzSWNvbiIsIlZvdGVJY29uIiwiUmVhY3QiLCJpMThuIiwiVCIsImNyZWF0ZUNvbXBvbmVudCIsInByb3BzIiwidmFsaWQiLCJDb2luIiwibnVtYnJvIiwiYXV0b2Zvcm1hdCIsImZvcm1hdHRlciIsImZvcm1hdCIsImNvbnN0cnVjdG9yIiwidG9Mb3dlckNhc2UiLCJNaW50aW5nRGVub20iLCJfYW1vdW50IiwiU3Rha2luZ0Rlbm9tIiwiU3Rha2luZ0ZyYWN0aW9uIiwiRXJyb3IiLCJzdGFraW5nQW1vdW50IiwicHJlY2lzaW9uIiwibWluU3Rha2UiLCJwb3ciLCJyZXBlYXQiLCJtaW50U3RyaW5nIiwic3Rha2VTdHJpbmciLCJzdGFraW5nRGVub20iLCJtaW50aW5nRGVub20iLCJNaW5TdGFrZSIsInJlbW90ZSIsInJwYyIsImxjZCIsInRpbWVyQmxvY2tzIiwidGltZXJDaGFpbiIsInRpbWVyQ29uc2Vuc3VzIiwidGltZXJQcm9wb3NhbCIsInRpbWVyRnVuZGluZ0N5Y2xlIiwidGltZXJQcm9wb3NhbHNSZXN1bHRzIiwidGltZXJNaXNzZWRCbG9jayIsInRpbWVyRGVsZWdhdGlvbiIsInRpbWVyQWdncmVnYXRlIiwidXBkYXRlQ2hhaW5TdGF0dXMiLCJlcnJvciIsInVwZGF0ZUJsb2NrIiwiZ2V0Q29uc2Vuc3VzU3RhdGUiLCJnZXRQcm9wb3NhbHMiLCJnZXRGdW5kaW5nQ3ljbGVzIiwiZ2V0UHJvcG9zYWxzUmVzdWx0cyIsInVwZGF0ZU1pc3NlZEJsb2NrU3RhdHMiLCJnZXREZWxlZ2F0aW9ucyIsImFnZ3JlZ2F0ZU1pbnV0ZWx5IiwiYWdncmVnYXRlSG91cmx5IiwiYWdncmVnYXRlRGFpbHkiLCJzdGFydHVwIiwiaXNEZXZlbG9wbWVudCIsInByb2Nlc3MiLCJlbnYiLCJOT0RFX1RMU19SRUpFQ1RfVU5BVVRIT1JJWkVEIiwiZGVidWciLCJzdGFydFRpbWVyIiwic2V0SW50ZXJ2YWwiLCJjb25zZW5zdXNJbnRlcnZhbCIsImJsb2NrSW50ZXJ2YWwiLCJzdGF0dXNJbnRlcnZhbCIsInByb3Bvc2FsSW50ZXJ2YWwiLCJmdW5kaW5nQ3ljbGVJbnRlcnZhbCIsIm1pc3NlZEJsb2Nrc0ludGVydmFsIiwiZGVsZWdhdGlvbkludGVydmFsIiwiZ2V0VVRDU2Vjb25kcyIsImdldFVUQ01pbnV0ZXMiLCJnZXRVVENIb3VycyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxJQUFJQSxNQUFKO0FBQVdDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZLGVBQVosRUFBNEI7QUFBQ0YsUUFBTSxDQUFDRyxDQUFELEVBQUc7QUFBQ0gsVUFBTSxHQUFDRyxDQUFQO0FBQVM7O0FBQXBCLENBQTVCLEVBQWtELENBQWxEO0FBQXFELElBQUlDLElBQUo7QUFBU0gsTUFBTSxDQUFDQyxJQUFQLENBQVksYUFBWixFQUEwQjtBQUFDRSxNQUFJLENBQUNELENBQUQsRUFBRztBQUFDQyxRQUFJLEdBQUNELENBQUw7QUFBTzs7QUFBaEIsQ0FBMUIsRUFBNEMsQ0FBNUM7QUFHekVILE1BQU0sQ0FBQ0ssT0FBUCxDQUFlO0FBQ1gseUJBQXVCLFVBQVNDLE9BQVQsRUFBaUI7QUFDcEMsU0FBS0MsT0FBTDtBQUNBLFFBQUlDLE9BQU8sR0FBRyxFQUFkLENBRm9DLENBR3BDOztBQUNBLFFBQUlDLEdBQUcsR0FBR0MsR0FBRyxHQUFHLGlCQUFOLEdBQXlCSixPQUFuQzs7QUFDQSxRQUFHO0FBQ0MsVUFBSUssU0FBUyxHQUFHUCxJQUFJLENBQUNRLEdBQUwsQ0FBU0gsR0FBVCxDQUFoQjs7QUFDQSxVQUFJRSxTQUFTLENBQUNFLFVBQVYsSUFBd0IsR0FBNUIsRUFBZ0M7QUFDNUI7QUFDQUwsZUFBTyxDQUFDRyxTQUFSLEdBQW9CRyxJQUFJLENBQUNDLEtBQUwsQ0FBV0osU0FBUyxDQUFDSyxPQUFyQixDQUFwQjtBQUNBLFlBQUlSLE9BQU8sQ0FBQ0csU0FBUixJQUFxQkgsT0FBTyxDQUFDRyxTQUFSLENBQWtCTSxNQUFsQixHQUEyQixDQUFwRCxFQUNJVCxPQUFPLENBQUNHLFNBQVIsR0FBb0JILE9BQU8sQ0FBQ0csU0FBUixDQUFrQixDQUFsQixDQUFwQjtBQUNQO0FBQ0osS0FSRCxDQVNBLE9BQU9PLENBQVAsRUFB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Qix3QkFBZ0IsR0FBR3plLE1BQU0sQ0FBQytmLFdBQVAsQ0FBbUIsWUFBVTtBQUM1Q1osZ0NBQXNCO0FBQ3pCLFNBRmtCLEVBRWhCbmYsTUFBTSxDQUFDbUUsUUFBUCxDQUFnQm1CLE1BQWhCLENBQXVCK2Esb0JBRlAsQ0FBbkI7QUFJQTNCLHVCQUFlLEdBQUcxZSxNQUFNLENBQUMrZixXQUFQLENBQW1CLFlBQVU7QUFDM0NYLHdCQUFjO0FBQ2pCLFNBRmlCLEVBRWZwZixNQUFNLENBQUNtRSxRQUFQLENBQWdCbUIsTUFBaEIsQ0FBdUJnYixrQkFGUixDQUFsQjtBQUlBM0Isc0JBQWMsR0FBRzNlLE1BQU0sQ0FBQytmLFdBQVAsQ0FBbUIsWUFBVTtBQUMxQyxjQUFJcE0sR0FBRyxHQUFHLElBQUk3TixJQUFKLEVBQVY7O0FBQ0EsY0FBSzZOLEdBQUcsQ0FBQzRNLGFBQUosTUFBdUIsQ0FBNUIsRUFBK0I7QUFDM0JsQiw2QkFBaUI7QUFDcEI7O0FBRUQsY0FBSzFMLEdBQUcsQ0FBQzZNLGFBQUosTUFBdUIsQ0FBeEIsSUFBK0I3TSxHQUFHLENBQUM0TSxhQUFKLE1BQXVCLENBQTFELEVBQTZEO0FBQ3pEakIsMkJBQWU7QUFDbEI7O0FBRUQsY0FBSzNMLEdBQUcsQ0FBQzhNLFdBQUosTUFBcUIsQ0FBdEIsSUFBNkI5TSxHQUFHLENBQUM2TSxhQUFKLE1BQXVCLENBQXBELElBQTJEN00sR0FBRyxDQUFDNE0sYUFBSixNQUF1QixDQUF0RixFQUF5RjtBQUNyRmhCLDBCQUFjO0FBQ2pCO0FBQ0osU0FiZ0IsRUFhZCxJQWJjLENBQWpCO0FBY0g7QUFDSjtBQUNKLEdBdEREO0FBd0RILENBN0RELEUiLCJmaWxlIjoiL2FwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgSFRUUCB9IGZyb20gJ21ldGVvci9odHRwJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICAgICdhY2NvdW50cy5nZXRCYWxhbmNlJzogZnVuY3Rpb24oYWRkcmVzcyl7XG4gICAgICAgIHRoaXMudW5ibG9jaygpO1xuICAgICAgICBsZXQgYmFsYW5jZSA9IHt9XG4gICAgICAgIC8vIGdldCBhdmFpbGFibGUgY29sb3JcbiAgICAgICAgbGV0IHVybCA9IExDRCArICcvYmFuay9iYWxhbmNlcy8nKyBhZGRyZXNzO1xuICAgICAgICB0cnl7XG4gICAgICAgICAgICBsZXQgYXZhaWxhYmxlID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgIGlmIChhdmFpbGFibGUuc3RhdHVzQ29kZSA9PSAyMDApe1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT04ucGFyc2UoYXZhaWxhYmxlLmNvbnRlbnQpKVxuICAgICAgICAgICAgICAgIGJhbGFuY2UuYXZhaWxhYmxlID0gSlNPTi5wYXJzZShhdmFpbGFibGUuY29udGVudCk7XG4gICAgICAgICAgICAgICAgaWYgKGJhbGFuY2UuYXZhaWxhYmxlICYmIGJhbGFuY2UuYXZhaWxhYmxlLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgICAgIGJhbGFuY2UuYXZhaWxhYmxlID0gYmFsYW5jZS5hdmFpbGFibGVbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdldCBkZWxlZ2F0ZWQgYW1ub3VudHNcbiAgICAgICAgdXJsID0gTENEICsgJy9zdGFraW5nL2RlbGVnYXRvcnMvJythZGRyZXNzKycvZGVsZWdhdGlvbnMnO1xuICAgICAgICB0cnl7XG4gICAgICAgICAgICBsZXQgZGVsZWdhdGlvbnMgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgaWYgKGRlbGVnYXRpb25zLnN0YXR1c0NvZGUgPT0gMjAwKXtcbiAgICAgICAgICAgICAgICBiYWxhbmNlLmRlbGVnYXRpb25zID0gSlNPTi5wYXJzZShkZWxlZ2F0aW9ucy5jb250ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBnZXQgdW5ib25kaW5nXG4gICAgICAgIHVybCA9IExDRCArICcvc3Rha2luZy9kZWxlZ2F0b3JzLycrYWRkcmVzcysnL3VuYm9uZGluZ19kZWxlZ2F0aW9ucyc7XG4gICAgICAgIHRyeXtcbiAgICAgICAgICAgIGxldCB1bmJvbmRpbmcgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgaWYgKHVuYm9uZGluZy5zdGF0dXNDb2RlID09IDIwMCl7XG4gICAgICAgICAgICAgICAgYmFsYW5jZS51bmJvbmRpbmcgPSBKU09OLnBhcnNlKHVuYm9uZGluZy5jb250ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdldCByZXdhcmRzXG4gICAgICAgIHVybCA9IExDRCArICcvZGlzdHJpYnV0aW9uL2RlbGVnYXRvcnMvJythZGRyZXNzKycvcmV3YXJkcyc7XG4gICAgICAgIHRyeXtcbiAgICAgICAgICAgIGxldCByZXdhcmRzID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgIGlmIChyZXdhcmRzLnN0YXR1c0NvZGUgPT0gMjAwKXtcbiAgICAgICAgICAgICAgICBiYWxhbmNlLnJld2FyZHMgPSBKU09OLnBhcnNlKHJld2FyZHMuY29udGVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYmFsYW5jZTtcbiAgICB9LFxuICAgICdhY2NvdW50cy5nZXRBbGxEZWxlZ2F0aW9ucycoYWRkcmVzcyl7XG4gICAgICAgIGxldCB1cmwgPSBMQ0QgKyAnL3N0YWtpbmcvZGVsZWdhdG9ycy8nK2FkZHJlc3MrJy9kZWxlZ2F0aW9ucyc7XG5cbiAgICAgICAgdHJ5e1xuICAgICAgICAgICAgbGV0IGRlbGVnYXRpb25zID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgIGlmIChkZWxlZ2F0aW9ucy5zdGF0dXNDb2RlID09IDIwMCl7XG4gICAgICAgICAgICAgICAgZGVsZWdhdGlvbnMgPSBKU09OLnBhcnNlKGRlbGVnYXRpb25zLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIGlmIChkZWxlZ2F0aW9ucyAmJiBkZWxlZ2F0aW9ucy5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGlvbnMuZm9yRWFjaCgoZGVsZWdhdGlvbiwgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlbGVnYXRpb25zW2ldICYmIGRlbGVnYXRpb25zW2ldLnNoYXJlcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0aW9uc1tpXS5zaGFyZXMgPSBwYXJzZUZsb2F0KGRlbGVnYXRpb25zW2ldLnNoYXJlcyk7XG4gICAgICAgICAgICAgICAgICAgIH0pICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGlvbnM7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAnYWNjb3VudHMuZ2V0QWxsVW5ib25kaW5ncycoYWRkcmVzcyl7XG4gICAgICAgIGxldCB1cmwgPSBMQ0QgKyAnL3N0YWtpbmcvZGVsZWdhdG9ycy8nK2FkZHJlc3MrJy91bmJvbmRpbmdfZGVsZWdhdGlvbnMnO1xuXG4gICAgICAgIHRyeXtcbiAgICAgICAgICAgIGxldCB1bmJvbmRpbmdzID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgIGlmICh1bmJvbmRpbmdzLnN0YXR1c0NvZGUgPT0gMjAwKXtcbiAgICAgICAgICAgICAgICB1bmJvbmRpbmdzID0gSlNPTi5wYXJzZSh1bmJvbmRpbmdzLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmJvbmRpbmdzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgfVxuICAgIH1cbn0pIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBIVFRQIH0gZnJvbSAnbWV0ZW9yL2h0dHAnO1xuaW1wb3J0IHsgUHJvbWlzZSB9IGZyb20gXCJtZXRlb3IvcHJvbWlzZVwiO1xuaW1wb3J0IHsgQmxvY2tzY29uIH0gZnJvbSAnL2ltcG9ydHMvYXBpL2Jsb2Nrcy9ibG9ja3MuanMnO1xuaW1wb3J0IHsgQ2hhaW4gfSBmcm9tICcvaW1wb3J0cy9hcGkvY2hhaW4vY2hhaW4uanMnO1xuaW1wb3J0IHsgVmFsaWRhdG9yU2V0cyB9IGZyb20gJy9pbXBvcnRzL2FwaS92YWxpZGF0b3Itc2V0cy92YWxpZGF0b3Itc2V0cy5qcyc7XG5pbXBvcnQgeyBWYWxpZGF0b3JzIH0gZnJvbSAnL2ltcG9ydHMvYXBpL3ZhbGlkYXRvcnMvdmFsaWRhdG9ycy5qcyc7XG5pbXBvcnQgeyBWYWxpZGF0b3JSZWNvcmRzLCBBbmFseXRpY3MsIFZQRGlzdHJpYnV0aW9uc30gZnJvbSAnL2ltcG9ydHMvYXBpL3JlY29yZHMvcmVjb3Jkcy5qcyc7XG5pbXBvcnQgeyBWb3RpbmdQb3dlckhpc3RvcnkgfSBmcm9tICcvaW1wb3J0cy9hcGkvdm90aW5nLXBvd2VyL2hpc3RvcnkuanMnO1xuaW1wb3J0IHsgVHJhbnNhY3Rpb25zIH0gZnJvbSAnLi4vLi4vdHJhbnNhY3Rpb25zL3RyYW5zYWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBFdmlkZW5jZXMgfSBmcm9tICcuLi8uLi9ldmlkZW5jZXMvZXZpZGVuY2VzLmpzJztcbmltcG9ydCB7IHNoYTI1NiB9IGZyb20gJ2pzLXNoYTI1Nic7XG5pbXBvcnQgeyBnZXRBZGRyZXNzIH0gZnJvbSAndGVuZGVybWludC9saWIvcHVia2V5J1xuXG4vLyBpbXBvcnQgQmxvY2sgZnJvbSAnLi4vLi4vLi4vdWkvY29tcG9uZW50cy9CbG9jayc7XG5cbi8vIGdldFZhbGlkYXRvclZvdGluZ1Bvd2VyID0gKHZhbGlkYXRvcnMsIGFkZHJlc3MpID0+IHtcbi8vICAgICBmb3IgKHYgaW4gdmFsaWRhdG9ycyl7XG4vLyAgICAgICAgIGlmICh2YWxpZGF0b3JzW3ZdLmFkZHJlc3MgPT0gYWRkcmVzcyl7XG4vLyAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodmFsaWRhdG9yc1t2XS52b3RpbmdfcG93ZXIpO1xuLy8gICAgICAgICB9XG4vLyAgICAgfVxuLy8gfVxuXG5nZXRSZW1vdmVkVmFsaWRhdG9ycyA9IChwcmV2VmFsaWRhdG9ycywgdmFsaWRhdG9ycykgPT4ge1xuICAgIC8vIGxldCByZW1vdmVWYWxpZGF0b3JzID0gW107XG4gICAgZm9yIChwIGluIHByZXZWYWxpZGF0b3JzKXtcbiAgICAgICAgZm9yICh2IGluIHZhbGlkYXRvcnMpe1xuICAgICAgICAgICAgaWYgKHByZXZWYWxpZGF0b3JzW3BdLmFkZHJlc3MgPT0gdmFsaWRhdG9yc1t2XS5hZGRyZXNzKXtcbiAgICAgICAgICAgICAgICBwcmV2VmFsaWRhdG9ycy5zcGxpY2UocCwxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwcmV2VmFsaWRhdG9ycztcbn1cblxuLy8gdmFyIGZpbHRlcmVkID0gWzEsIDIsIDMsIDQsIDVdLmZpbHRlcihub3RDb250YWluZWRJbihbMSwgMiwgMywgNV0pKTtcbi8vIGNvbnNvbGUubG9nKGZpbHRlcmVkKTsgLy8gWzRdXG5cbk1ldGVvci5tZXRob2RzKHtcbiAgICAnYmxvY2tzLmF2ZXJhZ2VCbG9ja1RpbWUnKGFkZHJlc3Mpe1xuICAgICAgICBsZXQgYmxvY2tzID0gQmxvY2tzY29uLmZpbmQoe3Byb3Bvc2VyQWRkcmVzczphZGRyZXNzfSkuZmV0Y2goKTtcbiAgICAgICAgbGV0IGhlaWdodHMgPSBibG9ja3MubWFwKChibG9jaywgaSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGJsb2NrLmhlaWdodDtcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBibG9ja3NTdGF0cyA9IEFuYWx5dGljcy5maW5kKHtoZWlnaHQ6eyRpbjpoZWlnaHRzfX0pLmZldGNoKCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGJsb2Nrc1N0YXRzKTtcblxuICAgICAgICBsZXQgdG90YWxCbG9ja0RpZmYgPSAwO1xuICAgICAgICBmb3IgKGIgaW4gYmxvY2tzU3RhdHMpe1xuICAgICAgICAgICAgdG90YWxCbG9ja0RpZmYgKz0gYmxvY2tzU3RhdHNbYl0udGltZURpZmY7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvdGFsQmxvY2tEaWZmL2hlaWdodHMubGVuZ3RoO1xuICAgIH0sXG4gICAgJ2Jsb2Nrcy5maW5kVXBUaW1lJyhhZGRyZXNzKXtcbiAgICAgICAgbGV0IGNvbGxlY3Rpb24gPSBWYWxpZGF0b3JSZWNvcmRzLnJhd0NvbGxlY3Rpb24oKTtcbiAgICAgICAgLy8gbGV0IGFnZ3JlZ2F0ZVF1ZXJ5ID0gTWV0ZW9yLndyYXBBc3luYyhjb2xsZWN0aW9uLmFnZ3JlZ2F0ZSwgY29sbGVjdGlvbik7XG4gICAgICAgIHZhciBwaXBlbGluZSA9IFtcbiAgICAgICAgICAgIHskbWF0Y2g6e1wiYWRkcmVzc1wiOmFkZHJlc3N9fSxcbiAgICAgICAgICAgIC8vIHskcHJvamVjdDp7YWRkcmVzczoxLGhlaWdodDoxLGV4aXN0czoxfX0sXG4gICAgICAgICAgICB7JHNvcnQ6e1wiaGVpZ2h0XCI6LTF9fSxcbiAgICAgICAgICAgIHskbGltaXQ6KE1ldGVvci5zZXR0aW5ncy5wdWJsaWMudXB0aW1lV2luZG93LTEpfSxcbiAgICAgICAgICAgIHskdW53aW5kOiBcIiRfaWRcIn0sXG4gICAgICAgICAgICB7JGdyb3VwOntcbiAgICAgICAgICAgICAgICBcIl9pZFwiOiBcIiRhZGRyZXNzXCIsXG4gICAgICAgICAgICAgICAgXCJ1cHRpbWVcIjoge1xuICAgICAgICAgICAgICAgICAgICBcIiRzdW1cIjp7XG4gICAgICAgICAgICAgICAgICAgICAgICAkY29uZDogW3skZXE6IFsnJGV4aXN0cycsIHRydWVdfSwgMSwgMF1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1dO1xuICAgICAgICAvLyBsZXQgcmVzdWx0ID0gYWdncmVnYXRlUXVlcnkocGlwZWxpbmUsIHsgY3Vyc29yOiB7fSB9KTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hd2FpdChjb2xsZWN0aW9uLmFnZ3JlZ2F0ZShwaXBlbGluZSkudG9BcnJheSgpKTtcbiAgICAgICAgLy8gcmV0dXJuIC5hZ2dyZWdhdGUoKVxuICAgIH0sXG4gICAgJ2Jsb2Nrcy5nZXRMYXRlc3RIZWlnaHQnOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy51bmJsb2NrKCk7XG4gICAgICAgIGxldCB1cmwgPSBSUEMrJy9zdGF0dXMnO1xuICAgICAgICB0cnl7XG4gICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgbGV0IHN0YXR1cyA9IEpTT04ucGFyc2UocmVzcG9uc2UuY29udGVudCk7XG4gICAgICAgICAgICByZXR1cm4gKHN0YXR1cy5yZXN1bHQuc3luY19pbmZvLmxhdGVzdF9ibG9ja19oZWlnaHQpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKXtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAnYmxvY2tzLmdldEN1cnJlbnRIZWlnaHQnOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy51bmJsb2NrKCk7XG4gICAgICAgIGxldCBjdXJySGVpZ2h0ID0gQmxvY2tzY29uLmZpbmQoe30se3NvcnQ6e2hlaWdodDotMX0sbGltaXQ6MX0pLmZldGNoKCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiY3VycmVudEhlaWdodDpcIitjdXJySGVpZ2h0KTtcbiAgICAgICAgaWYgKGN1cnJIZWlnaHQgJiYgY3VyckhlaWdodC5sZW5ndGggPT0gMSlcbiAgICAgICAgICAgIHJldHVybiBjdXJySGVpZ2h0WzBdLmhlaWdodDtcbiAgICAgICAgZWxzZSByZXR1cm4gTWV0ZW9yLnNldHRpbmdzLnBhcmFtcy5zdGFydEhlaWdodDtcbiAgICB9LFxuICAgICdibG9ja3MuYmxvY2tzVXBkYXRlJzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChTWU5DSU5HKVxuICAgICAgICAgICAgcmV0dXJuIFwiU3luY2luZy4uLlwiO1xuICAgICAgICBlbHNlIGNvbnNvbGUubG9nKFwic3RhcnQgdG8gc3luY1wiKTtcbiAgICAgICAgLy8gTWV0ZW9yLmNsZWFySW50ZXJ2YWwoTWV0ZW9yLnRpbWVySGFuZGxlKTtcbiAgICAgICAgLy8gZ2V0IHRoZSBsYXRlc3QgaGVpZ2h0XG4gICAgICAgIGxldCB1bnRpbCA9IE1ldGVvci5jYWxsKCdibG9ja3MuZ2V0TGF0ZXN0SGVpZ2h0Jyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHVudGlsKTtcbiAgICAgICAgLy8gZ2V0IHRoZSBjdXJyZW50IGhlaWdodCBpbiBkYlxuICAgICAgICBsZXQgY3VyciA9IE1ldGVvci5jYWxsKCdibG9ja3MuZ2V0Q3VycmVudEhlaWdodCcpO1xuICAgICAgICBjb25zb2xlLmxvZyhjdXJyKTtcbiAgICAgICAgLy8gbG9vcCBpZiB0aGVyZSdzIHVwZGF0ZSBpbiBkYlxuICAgICAgICBpZiAodW50aWwgPiBjdXJyKSB7XG4gICAgICAgICAgICBTWU5DSU5HID0gdHJ1ZTtcblxuICAgICAgICAgICAgbGV0IHZhbGlkYXRvclNldDtcbiAgICAgICAgICAgIC8vIGdldCBsYXRlc3QgdmFsaWRhdG9yIGNhbmRpZGF0ZSBpbmZvcm1hdGlvblxuICAgICAgICAgICAgdXJsID0gTENEKycvc3Rha2luZy92YWxpZGF0b3JzJztcblxuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JTZXQgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2goZSl7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHVybCA9IExDRCsnL3N0YWtpbmcvdmFsaWRhdG9ycz9zdGF0dXM9dW5ib25kaW5nJztcblxuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgICAgICBbLi4udmFsaWRhdG9yU2V0XSA9IFsuLi52YWxpZGF0b3JTZXQsIC4uLkpTT04ucGFyc2UocmVzcG9uc2UuY29udGVudCldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2goZSl7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHVybCA9IExDRCsnL3N0YWtpbmcvdmFsaWRhdG9ycz9zdGF0dXM9dW5ib25kZWQnO1xuXG4gICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgICAgIFsuLi52YWxpZGF0b3JTZXRdID0gWy4uLnZhbGlkYXRvclNldCwgLi4uSlNPTi5wYXJzZShyZXNwb25zZS5jb250ZW50KV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaChlKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJhbGwgdmFsaWRhdG9yczogXCIrdmFsaWRhdG9yU2V0Lmxlbmd0aCk7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGhlaWdodCA9IGN1cnIrMSA7IGhlaWdodCA8PSB1bnRpbCA7IGhlaWdodCsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0QmxvY2tUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGltZW91dCBoZXJlPyBhbmQgb3V0c2lkZSB0aGlzIGxvb3AgKGZvciBjYXRjaGVkIHVwIGFuZCBrZWVwIGZldGNoaW5nKT9cbiAgICAgICAgICAgICAgICB0aGlzLnVuYmxvY2soKTtcbiAgICAgICAgICAgICAgICBsZXQgdXJsID0gUlBDKycvYmxvY2s/aGVpZ2h0PScgKyBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgbGV0IGFuYWx5dGljc0RhdGEgPSB7fTtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHVybCk7XG4gICAgICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBidWxrVmFsaWRhdG9ycyA9IFZhbGlkYXRvcnMucmF3Q29sbGVjdGlvbigpLmluaXRpYWxpemVVbm9yZGVyZWRCdWxrT3AoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYnVsa1ZhbGlkYXRvclJlY29yZHMgPSBWYWxpZGF0b3JSZWNvcmRzLnJhd0NvbGxlY3Rpb24oKS5pbml0aWFsaXplVW5vcmRlcmVkQnVsa09wKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJ1bGtWUEhpc3RvcnkgPSBWb3RpbmdQb3dlckhpc3RvcnkucmF3Q29sbGVjdGlvbigpLmluaXRpYWxpemVVbm9yZGVyZWRCdWxrT3AoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYnVsa1RyYW5zYXRpb25zID0gVHJhbnNhY3Rpb25zLnJhd0NvbGxlY3Rpb24oKS5pbml0aWFsaXplVW5vcmRlcmVkQnVsa09wKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHN0YXJ0R2V0SGVpZ2h0VGltZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXNwb25zZSA9IEhUVFAuZ2V0KHVybCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlID09IDIwMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYmxvY2sgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2sgPSBibG9jay5yZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzdG9yZSBoZWlnaHQsIGhhc2gsIG51bXRyYW5zYWN0aW9uIGFuZCB0aW1lIGluIGRiXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYmxvY2tEYXRhID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9ja0RhdGEuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tEYXRhLmhhc2ggPSBibG9jay5ibG9ja19tZXRhLmJsb2NrX2lkLmhhc2g7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9ja0RhdGEudHJhbnNOdW0gPSBibG9jay5ibG9ja19tZXRhLmhlYWRlci5udW1fdHhzO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tEYXRhLnRpbWUgPSBuZXcgRGF0ZShibG9jay5ibG9jay5oZWFkZXIudGltZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9ja0RhdGEubGFzdEJsb2NrSGFzaCA9IGJsb2NrLmJsb2NrLmhlYWRlci5sYXN0X2Jsb2NrX2lkLmhhc2g7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9ja0RhdGEucHJvcG9zZXJBZGRyZXNzID0gYmxvY2suYmxvY2suaGVhZGVyLnByb3Bvc2VyX2FkZHJlc3M7XG4gICAgICAgICAgICAgICAgICAgICAgICBibG9ja0RhdGEudmFsaWRhdG9ycyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHByZWNvbW1pdHMgPSBibG9jay5ibG9jay5sYXN0X2NvbW1pdC5wcmVjb21taXRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZWNvbW1pdHMgIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocHJlY29tbWl0cy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGk9MDsgaTxwcmVjb21taXRzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZWNvbW1pdHNbaV0gIT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja0RhdGEudmFsaWRhdG9ycy5wdXNoKHByZWNvbW1pdHNbaV0udmFsaWRhdG9yX2FkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5hbHl0aWNzRGF0YS5wcmVjb21taXRzID0gcHJlY29tbWl0cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVjb3JkIGZvciBhbmFseXRpY3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmVjb21taXRSZWNvcmRzLmluc2VydCh7aGVpZ2h0OmhlaWdodCwgcHJlY29tbWl0czpwcmVjb21taXRzLmxlbmd0aH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzYXZlIHR4cyBpbiBkYXRhYmFzZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJsb2NrLmJsb2NrLmRhdGEudHhzICYmIGJsb2NrLmJsb2NrLmRhdGEudHhzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodCBpbiBibG9jay5ibG9jay5kYXRhLnR4cyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1ldGVvci5jYWxsKCdUcmFuc2FjdGlvbnMuaW5kZXgnLCBzaGEyNTYoQnVmZmVyLmZyb20oYmxvY2suYmxvY2suZGF0YS50eHNbdF0sICdiYXNlNjQnKSksIGJsb2NrRGF0YS50aW1lLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2F2ZSBkb3VibGUgc2lnbiBldmlkZW5jZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChibG9jay5ibG9jay5ldmlkZW5jZS5ldmlkZW5jZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRXZpZGVuY2VzLmluc2VydCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmlkZW5jZTogYmxvY2suYmxvY2suZXZpZGVuY2UuZXZpZGVuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tEYXRhLnByZWNvbW1pdHNDb3VudCA9IGJsb2NrRGF0YS52YWxpZGF0b3JzLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYW5hbHl0aWNzRGF0YS5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbmRHZXRIZWlnaHRUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiR2V0IGhlaWdodCB0aW1lOiBcIisoKGVuZEdldEhlaWdodFRpbWUtc3RhcnRHZXRIZWlnaHRUaW1lKS8xMDAwKStcInNlY29uZHMuXCIpO1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdGFydEdldFZhbGlkYXRvcnNUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBjaGFpbiBzdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IFJQQysnL3ZhbGlkYXRvcnM/aGVpZ2h0PScraGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWxpZGF0b3JzID0gSlNPTi5wYXJzZShyZXNwb25zZS5jb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvcnMucmVzdWx0LmJsb2NrX2hlaWdodCA9IHBhcnNlSW50KHZhbGlkYXRvcnMucmVzdWx0LmJsb2NrX2hlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBWYWxpZGF0b3JTZXRzLmluc2VydCh2YWxpZGF0b3JzLnJlc3VsdCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrRGF0YS52YWxpZGF0b3JzQ291bnQgPSB2YWxpZGF0b3JzLnJlc3VsdC52YWxpZGF0b3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdGFydEJsb2NrSW5zZXJ0VGltZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBCbG9ja3Njb24uaW5zZXJ0KGJsb2NrRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW5kQmxvY2tJbnNlcnRUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQmxvY2sgaW5zZXJ0IHRpbWU6IFwiKygoZW5kQmxvY2tJbnNlcnRUaW1lLXN0YXJ0QmxvY2tJbnNlcnRUaW1lKS8xMDAwKStcInNlY29uZHMuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzdG9yZSB2YWxkaWF0b3JzIGV4aXN0IHJlY29yZHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBleGlzdGluZ1ZhbGlkYXRvcnMgPSBWYWxpZGF0b3JzLmZpbmQoe2FkZHJlc3M6eyRleGlzdHM6dHJ1ZX19KS5mZXRjaCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0ID4gMSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVjb3JkIHByZWNvbW1pdHMgYW5kIGNhbGN1bGF0ZSB1cHRpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IHJlY29yZCBmcm9tIGJsb2NrIDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgaW4gdmFsaWRhdG9ycy5yZXN1bHQudmFsaWRhdG9ycyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhZGRyZXNzID0gdmFsaWRhdG9ycy5yZXN1bHQudmFsaWRhdG9yc1tpXS5hZGRyZXNzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVjb3JkID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3RzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZvdGluZ19wb3dlcjogcGFyc2VJbnQodmFsaWRhdG9ycy5yZXN1bHQudmFsaWRhdG9yc1tpXS52b3RpbmdfcG93ZXIpLy9nZXRWYWxpZGF0b3JWb3RpbmdQb3dlcihleGlzdGluZ1ZhbGlkYXRvcnMsIGFkZHJlc3MpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogaW4gcHJlY29tbWl0cyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJlY29tbWl0c1tqXSAhPSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWRkcmVzcyA9PSBwcmVjb21taXRzW2pdLnZhbGlkYXRvcl9hZGRyZXNzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjb3JkLmV4aXN0cyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWNvbW1pdHMuc3BsaWNlKGosMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgdXB0aW1lIGJhc2VkIG9uIHRoZSByZWNvcmRzIHN0b3JlZCBpbiBwcmV2aW91cyBibG9ja3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb25seSBkbyB0aGlzIGV2ZXJ5IDE1IGJsb2NrcyB+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChoZWlnaHQgJSAxNSkgPT0gMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsZXQgc3RhcnRBZ2dUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBudW1CbG9ja3MgPSBNZXRlb3IuY2FsbCgnYmxvY2tzLmZpbmRVcFRpbWUnLCBhZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB1cHRpbWUgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGV0IGVuZEFnZ1RpbWUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJHZXQgYWdncmVnYXRlZCB1cHRpbWUgZm9yIFwiK2V4aXN0aW5nVmFsaWRhdG9yc1tpXS5hZGRyZXNzK1wiOiBcIisoKGVuZEFnZ1RpbWUtc3RhcnRBZ2dUaW1lKS8xMDAwKStcInNlY29uZHMuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChudW1CbG9ja3NbMF0gIT0gbnVsbCkgJiYgKG51bUJsb2Nrc1swXS51cHRpbWUgIT0gbnVsbCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwdGltZSA9IG51bUJsb2Nrc1swXS51cHRpbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBiYXNlID0gTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy51cHRpbWVXaW5kb3c7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0IDwgYmFzZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFzZSA9IGhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlY29yZC5leGlzdHMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1cHRpbWUgPCBiYXNlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXB0aW1lKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwdGltZSA9ICh1cHRpbWUgLyBiYXNlKSoxMDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVsa1ZhbGlkYXRvcnMuZmluZCh7YWRkcmVzczphZGRyZXNzfSkudXBzZXJ0KCkudXBkYXRlT25lKHskc2V0Ont1cHRpbWU6dXB0aW1lLCBsYXN0U2VlbjpibG9ja0RhdGEudGltZX19KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXB0aW1lID0gKHVwdGltZSAvIGJhc2UpKjEwMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWxrVmFsaWRhdG9ycy5maW5kKHthZGRyZXNzOmFkZHJlc3N9KS51cHNlcnQoKS51cGRhdGVPbmUoeyRzZXQ6e3VwdGltZTp1cHRpbWV9fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWxrVmFsaWRhdG9yUmVjb3Jkcy5pbnNlcnQocmVjb3JkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsaWRhdG9yUmVjb3Jkcy51cGRhdGUoe2hlaWdodDpoZWlnaHQsYWRkcmVzczpyZWNvcmQuYWRkcmVzc30scmVjb3JkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjaGFpblN0YXR1cyA9IENoYWluLmZpbmRPbmUoe2NoYWluSWQ6YmxvY2suYmxvY2tfbWV0YS5oZWFkZXIuY2hhaW5faWR9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsYXN0U3luY2VkVGltZSA9IGNoYWluU3RhdHVzP2NoYWluU3RhdHVzLmxhc3RTeW5jZWRUaW1lOjA7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGltZURpZmY7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYmxvY2tUaW1lID0gTWV0ZW9yLnNldHRpbmdzLnBhcmFtcy5kZWZhdWx0QmxvY2tUaW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RTeW5jZWRUaW1lKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGF0ZUxhdGVzdCA9IGJsb2NrRGF0YS50aW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkYXRlTGFzdCA9IG5ldyBEYXRlKGxhc3RTeW5jZWRUaW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lRGlmZiA9IE1hdGguYWJzKGRhdGVMYXRlc3QuZ2V0VGltZSgpIC0gZGF0ZUxhc3QuZ2V0VGltZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2Jsb2NrVGltZSA9IChjaGFpblN0YXR1cy5ibG9ja1RpbWUgKiAoYmxvY2tEYXRhLmhlaWdodCAtIDEpICsgdGltZURpZmYpIC8gYmxvY2tEYXRhLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGltZURpZmYgPCBjaGFpblN0YXR1cy5ibG9ja1RpbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrVGltZSA9IHRpbWVEaWZmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja1RpbWUgPSBjaGFpblN0YXR1cy5ibG9ja1RpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbmRHZXRWYWxpZGF0b3JzVGltZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdldCBoZWlnaHQgdmFsaWRhdG9ycyB0aW1lOiBcIisoKGVuZEdldFZhbGlkYXRvcnNUaW1lLXN0YXJ0R2V0VmFsaWRhdG9yc1RpbWUpLzEwMDApK1wic2Vjb25kcy5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIENoYWluLnVwZGF0ZSh7Y2hhaW5JZDpibG9jay5ibG9ja19tZXRhLmhlYWRlci5jaGFpbl9pZH0sIHskc2V0OntsYXN0U3luY2VkVGltZTpibG9ja0RhdGEudGltZSwgYmxvY2tUaW1lOmJsb2NrVGltZX19KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYW5hbHl0aWNzRGF0YS5hdmVyYWdlQmxvY2tUaW1lID0gYmxvY2tUaW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5hbHl0aWNzRGF0YS50aW1lRGlmZiA9IHRpbWVEaWZmO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBhbmFseXRpY3NEYXRhLnRpbWUgPSBibG9ja0RhdGEudGltZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5pdGlhbGl6ZSB2YWxpZGF0b3IgZGF0YSBhdCBmaXJzdCBibG9ja1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKGhlaWdodCA9PSAxKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBWYWxpZGF0b3JzLnJlbW92ZSh7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGFuYWx5dGljc0RhdGEudm90aW5nX3Bvd2VyID0gMDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmFsaWRhdG9ycyBhcmUgYWxsIHRoZSB2YWxpZGF0b3JzIGluIHRoZSBjdXJyZW50IGhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJ2YWxpZGF0b3JTZXQubGVuZ3RoOiBcIit2YWxpZGF0b3JTZXQubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdGFydEZpbmRWYWxpZGF0b3JzTmFtZVRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbGlkYXRvcnMucmVzdWx0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHYgaW4gdmFsaWRhdG9ycy5yZXN1bHQudmFsaWRhdG9ycyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZhbGlkYXRvcnMuaW5zZXJ0KHZhbGlkYXRvcnMucmVzdWx0LnZhbGlkYXRvcnNbdl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsaWRhdG9yID0gdmFsaWRhdG9ycy5yZXN1bHQudmFsaWRhdG9yc1t2XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLnZvdGluZ19wb3dlciA9IHBhcnNlSW50KHZhbGlkYXRvci52b3RpbmdfcG93ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3IucHJvcG9zZXJfcHJpb3JpdHkgPSBwYXJzZUludCh2YWxpZGF0b3IucHJvcG9zZXJfcHJpb3JpdHkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWxFeGlzdCA9IFZhbGlkYXRvcnMuZmluZE9uZSh7XCJwdWJfa2V5LnZhbHVlXCI6dmFsaWRhdG9yLnB1Yl9rZXkudmFsdWV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWxFeGlzdCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInZhbGlkYXRvciBwdWJfa2V5IG5vdCBpbiBkYlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxldCBjb21tYW5kID0gTWV0ZW9yLnNldHRpbmdzLmJpbi5nYWlhZGVidWcrXCIgcHVia2V5IFwiK3ZhbGlkYXRvci5wdWJfa2V5LnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coY29tbWFuZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsZXQgdGVtcFZhbCA9IHZhbGlkYXRvcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLmFkZHJlc3MgPSBnZXRBZGRyZXNzKHZhbGlkYXRvci5wdWJfa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5hY2NwdWIgPSBNZXRlb3IuY2FsbCgncHVia2V5VG9CZWNoMzInLCB2YWxpZGF0b3IucHViX2tleSwgTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5iZWNoMzJQcmVmaXhBY2NQdWIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLm9wZXJhdG9yX3B1YmtleSA9IE1ldGVvci5jYWxsKCdwdWJrZXlUb0JlY2gzMicsIHZhbGlkYXRvci5wdWJfa2V5LCBNZXRlb3Iuc2V0dGluZ3MucHVibGljLmJlY2gzMlByZWZpeFZhbFB1Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3IuY29uc2Vuc3VzX3B1YmtleSA9IE1ldGVvci5jYWxsKCdwdWJrZXlUb0JlY2gzMicsIHZhbGlkYXRvci5wdWJfa2V5LCBNZXRlb3Iuc2V0dGluZ3MucHVibGljLmJlY2gzMlByZWZpeENvbnNQdWIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhbCBpbiB2YWxpZGF0b3JTZXQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWxpZGF0b3JTZXRbdmFsXS5jb25zZW5zdXNfcHVia2V5ID09IHZhbGlkYXRvci5jb25zZW5zdXNfcHVia2V5KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLm9wZXJhdG9yX2FkZHJlc3MgPSB2YWxpZGF0b3JTZXRbdmFsXS5vcGVyYXRvcl9hZGRyZXNzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3IuZGVsZWdhdG9yX2FkZHJlc3MgPSBNZXRlb3IuY2FsbCgnZ2V0RGVsZWdhdG9yJywgdmFsaWRhdG9yU2V0W3ZhbF0ub3BlcmF0b3JfYWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5qYWlsZWQgPSB2YWxpZGF0b3JTZXRbdmFsXS5qYWlsZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5zdGF0dXMgPSB2YWxpZGF0b3JTZXRbdmFsXS5zdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5taW5fc2VsZl9kZWxlZ2F0aW9uID0gdmFsaWRhdG9yU2V0W3ZhbF0ubWluX3NlbGZfZGVsZWdhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLnRva2VucyA9IHZhbGlkYXRvclNldFt2YWxdLnRva2VucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLmxlYWd1ZSA9IHZhbGlkYXRvclNldFt2YWxdLmxlYWd1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLmRlbGVnYXRvcl9zaGFyZXMgPSB2YWxpZGF0b3JTZXRbdmFsXS5kZWxlZ2F0b3Jfc2hhcmVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3IuZGVzY3JpcHRpb24gPSB2YWxpZGF0b3JTZXRbdmFsXS5kZXNjcmlwdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLmJvbmRfaGVpZ2h0ID0gdmFsaWRhdG9yU2V0W3ZhbF0uYm9uZF9oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5ib25kX2ludHJhX3R4X2NvdW50ZXIgPSB2YWxpZGF0b3JTZXRbdmFsXS5ib25kX2ludHJhX3R4X2NvdW50ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci51bmJvbmRpbmdfaGVpZ2h0ID0gdmFsaWRhdG9yU2V0W3ZhbF0udW5ib25kaW5nX2hlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLnVuYm9uZGluZ190aW1lID0gdmFsaWRhdG9yU2V0W3ZhbF0udW5ib25kaW5nX3RpbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5jb21taXNzaW9uID0gdmFsaWRhdG9yU2V0W3ZhbF0uY29tbWlzc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLnNlbGZfZGVsZWdhdGlvbiA9IHZhbGlkYXRvci5kZWxlZ2F0b3Jfc2hhcmVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2YWxpZGF0b3IucmVtb3ZlZCA9IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2YWxpZGF0b3IucmVtb3ZlZEF0ID0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2YWxpZGF0b3JTZXQuc3BsaWNlKHZhbCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYnVsa1ZhbGlkYXRvcnMuaW5zZXJ0KHZhbGlkYXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWxrVmFsaWRhdG9ycy5maW5kKHtjb25zZW5zdXNfcHVia2V5OiB2YWxpZGF0b3IuY29uc2Vuc3VzX3B1YmtleX0pLnVwc2VydCgpLnVwZGF0ZU9uZSh7JHNldDp2YWxpZGF0b3J9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwidmFsaWRhdG9yIGZpcnN0IGFwcGVhcnM6IFwiK2J1bGtWYWxpZGF0b3JzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWxrVlBIaXN0b3J5Lmluc2VydCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkcmVzczogdmFsaWRhdG9yLmFkZHJlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldl92b3RpbmdfcG93ZXI6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdm90aW5nX3Bvd2VyOiB2YWxpZGF0b3Iudm90aW5nX3Bvd2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhZGQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYmxvY2tEYXRhLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja190aW1lOiBibG9ja0RhdGEudGltZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFsIGluIHZhbGlkYXRvclNldCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbGlkYXRvclNldFt2YWxdLmNvbnNlbnN1c19wdWJrZXkgPT0gdmFsRXhpc3QuY29uc2Vuc3VzX3B1YmtleSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5qYWlsZWQgPSB2YWxpZGF0b3JTZXRbdmFsXS5qYWlsZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5zdGF0dXMgPSB2YWxpZGF0b3JTZXRbdmFsXS5zdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci50b2tlbnMgPSB2YWxpZGF0b3JTZXRbdmFsXS50b2tlbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5sZWFndWUgPSB2YWxpZGF0b3JTZXRbdmFsXS5sZWFndWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5kZWxlZ2F0b3Jfc2hhcmVzID0gdmFsaWRhdG9yU2V0W3ZhbF0uZGVsZWdhdG9yX3NoYXJlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLmRlc2NyaXB0aW9uID0gdmFsaWRhdG9yU2V0W3ZhbF0uZGVzY3JpcHRpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5ib25kX2hlaWdodCA9IHZhbGlkYXRvclNldFt2YWxdLmJvbmRfaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3IuYm9uZF9pbnRyYV90eF9jb3VudGVyID0gdmFsaWRhdG9yU2V0W3ZhbF0uYm9uZF9pbnRyYV90eF9jb3VudGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3IudW5ib25kaW5nX2hlaWdodCA9IHZhbGlkYXRvclNldFt2YWxdLnVuYm9uZGluZ19oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci51bmJvbmRpbmdfdGltZSA9IHZhbGlkYXRvclNldFt2YWxdLnVuYm9uZGluZ190aW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3IuY29tbWlzc2lvbiA9IHZhbGlkYXRvclNldFt2YWxdLmNvbW1pc3Npb247XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FsY3VsYXRlIHNlbGYgZGVsZWdhdGlvbiBwZXJjZW50YWdlIGV2ZXJ5IDMwIGJsb2Nrc1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgJSAzMCA9PSAxKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBIVFRQLmdldChMQ0QgKyAnL3N0YWtpbmcvZGVsZWdhdG9ycy8nK3ZhbEV4aXN0LmRlbGVnYXRvcl9hZGRyZXNzKycvZGVsZWdhdGlvbnMvJyt2YWxFeGlzdC5vcGVyYXRvcl9hZGRyZXNzKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlID09IDIwMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzZWxmRGVsZWdhdGlvbiA9IEpTT04ucGFyc2UocmVzcG9uc2UuY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmRGVsZWdhdGlvbi5zaGFyZXMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLnNlbGZfZGVsZWdhdGlvbiA9IHBhcnNlRmxvYXQoc2VsZkRlbGVnYXRpb24uc2hhcmVzKS9wYXJzZUZsb2F0KHZhbGlkYXRvci5kZWxlZ2F0b3Jfc2hhcmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoKGUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWxrVmFsaWRhdG9ycy5maW5kKHtjb25zZW5zdXNfcHVia2V5OiB2YWxFeGlzdC5jb25zZW5zdXNfcHVia2V5fSkudXBkYXRlT25lKHskc2V0OnZhbGlkYXRvcn0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcInZhbGlkYXRvciBleGlzaXRzOiBcIitidWxrVmFsaWRhdG9ycy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2YWxpZGF0b3JTZXQuc3BsaWNlKHZhbCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwcmV2Vm90aW5nUG93ZXIgPSBWb3RpbmdQb3dlckhpc3RvcnkuZmluZE9uZSh7YWRkcmVzczp2YWxpZGF0b3IuYWRkcmVzc30sIHtoZWlnaHQ6LTEsIGxpbWl0OjF9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZWb3RpbmdQb3dlcil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZWb3RpbmdQb3dlci52b3RpbmdfcG93ZXIgIT0gdmFsaWRhdG9yLnZvdGluZ19wb3dlcil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjaGFuZ2VUeXBlID0gKHByZXZWb3RpbmdQb3dlci52b3RpbmdfcG93ZXIgPiB2YWxpZGF0b3Iudm90aW5nX3Bvd2VyKT8nZG93bic6J3VwJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNoYW5nZURhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRyZXNzOiB2YWxpZGF0b3IuYWRkcmVzcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZfdm90aW5nX3Bvd2VyOiBwcmV2Vm90aW5nUG93ZXIudm90aW5nX3Bvd2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdm90aW5nX3Bvd2VyOiB2YWxpZGF0b3Iudm90aW5nX3Bvd2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogY2hhbmdlVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYmxvY2tEYXRhLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrX3RpbWU6IGJsb2NrRGF0YS50aW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCd2b3RpbmcgcG93ZXIgY2hhbmdlZC4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coY2hhbmdlRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1bGtWUEhpc3RvcnkuaW5zZXJ0KGNoYW5nZURhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh2YWxpZGF0b3IpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuYWx5dGljc0RhdGEudm90aW5nX3Bvd2VyICs9IHZhbGlkYXRvci52b3RpbmdfcG93ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgdmFsaWRhdG9yIHJlbW92ZWRcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwcmV2VmFsaWRhdG9ycyA9IFZhbGlkYXRvclNldHMuZmluZE9uZSh7YmxvY2tfaGVpZ2h0OmhlaWdodC0xfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJldlZhbGlkYXRvcnMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVtb3ZlZFZhbGlkYXRvcnMgPSBnZXRSZW1vdmVkVmFsaWRhdG9ycyhwcmV2VmFsaWRhdG9ycy52YWxpZGF0b3JzLCB2YWxpZGF0b3JzLnJlc3VsdC52YWxpZGF0b3JzKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHIgaW4gcmVtb3ZlZFZhbGlkYXRvcnMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVsa1ZQSGlzdG9yeS5pbnNlcnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZHJlc3M6IHJlbW92ZWRWYWxpZGF0b3JzW3JdLmFkZHJlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldl92b3RpbmdfcG93ZXI6IHJlbW92ZWRWYWxpZGF0b3JzW3JdLnZvdGluZ19wb3dlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b3RpbmdfcG93ZXI6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3JlbW92ZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBibG9ja0RhdGEuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrX3RpbWU6IGJsb2NrRGF0YS50aW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW5kRmluZFZhbGlkYXRvcnNOYW1lVGltZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkdldCB2YWxpZGF0b3JzIG5hbWUgdGltZTogXCIrKChlbmRGaW5kVmFsaWRhdG9yc05hbWVUaW1lLXN0YXJ0RmluZFZhbGlkYXRvcnNOYW1lVGltZSkvMTAwMCkrXCJzZWNvbmRzLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVjb3JkIGZvciBhbmFseXRpY3NcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzdGFydEFuYXl0aWNzSW5zZXJ0VGltZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBBbmFseXRpY3MuaW5zZXJ0KGFuYWx5dGljc0RhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVuZEFuYWx5dGljc0luc2VydFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJBbmFseXRpY3MgaW5zZXJ0IHRpbWU6IFwiKygoZW5kQW5hbHl0aWNzSW5zZXJ0VGltZS1zdGFydEFuYXl0aWNzSW5zZXJ0VGltZSkvMTAwMCkrXCJzZWNvbmRzLlwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHN0YXJ0VlVwVGltZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYnVsa1ZhbGlkYXRvcnMubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYnVsa1ZhbGlkYXRvcnMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWxrVmFsaWRhdG9ycy5leGVjdXRlKChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbmRWVXBUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVmFsaWRhdG9yIHVwZGF0ZSB0aW1lOiBcIisoKGVuZFZVcFRpbWUtc3RhcnRWVXBUaW1lKS8xMDAwKStcInNlY29uZHMuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgc3RhcnRWUlRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJ1bGtWYWxpZGF0b3JSZWNvcmRzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1bGtWYWxpZGF0b3JSZWNvcmRzLmV4ZWN1dGUoKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW5kVlJUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVmFsaWRhdG9yIHJlY29yZHMgdXBkYXRlIHRpbWU6IFwiKygoZW5kVlJUaW1lLXN0YXJ0VlJUaW1lKS8xMDAwKStcInNlY29uZHMuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYnVsa1ZQSGlzdG9yeS5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidWxrVlBIaXN0b3J5LmV4ZWN1dGUoKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYnVsa1RyYW5zYXRpb25zLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1bGtUcmFuc2F0aW9ucy5leGVjdXRlKChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FsY3VsYXRlIHZvdGluZyBwb3dlciBkaXN0cmlidXRpb24gZXZlcnkgNjAgYmxvY2tzIH4gNW1pbnNcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhlaWdodCAlIDYwID09IDEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPT09PT0gY2FsY3VsYXRlIHZvdGluZyBwb3dlciBkaXN0cmlidXRpb24gPT09PT1cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGFjdGl2ZVZhbGlkYXRvcnMgPSBWYWxpZGF0b3JzLmZpbmQoe3N0YXR1czoyLGphaWxlZDpmYWxzZX0se3NvcnQ6e3ZvdGluZ19wb3dlcjotMX19KS5mZXRjaCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBudW1Ub3BUd2VudHkgPSBNYXRoLmNlaWwoYWN0aXZlVmFsaWRhdG9ycy5sZW5ndGgqMC4yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbnVtQm90dG9tRWlnaHR5ID0gYWN0aXZlVmFsaWRhdG9ycy5sZW5ndGggLSBudW1Ub3BUd2VudHk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdG9wVHdlbnR5UG93ZXIgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib3R0b21FaWdodHlQb3dlciA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbnVtVG9wVGhpcnR5Rm91ciA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG51bUJvdHRvbVNpeHR5U2l4ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdG9wVGhpcnR5Rm91clBlcmNlbnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib3R0b21TaXh0eVNpeFBlcmNlbnQgPSAwO1xuXG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodiBpbiBhY3RpdmVWYWxpZGF0b3JzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYgPCBudW1Ub3BUd2VudHkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wVHdlbnR5UG93ZXIgKz0gYWN0aXZlVmFsaWRhdG9yc1t2XS52b3RpbmdfcG93ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbUVpZ2h0eVBvd2VyICs9IGFjdGl2ZVZhbGlkYXRvcnNbdl0udm90aW5nX3Bvd2VyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG9wVGhpcnR5Rm91clBlcmNlbnQgPCAwLjM0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcFRoaXJ0eUZvdXJQZXJjZW50ICs9IGFjdGl2ZVZhbGlkYXRvcnNbdl0udm90aW5nX3Bvd2VyIC8gYW5hbHl0aWNzRGF0YS52b3RpbmdfcG93ZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1Ub3BUaGlydHlGb3VyKys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3R0b21TaXh0eVNpeFBlcmNlbnQgPSAxIC0gdG9wVGhpcnR5Rm91clBlcmNlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtQm90dG9tU2l4dHlTaXggPSBhY3RpdmVWYWxpZGF0b3JzLmxlbmd0aCAtIG51bVRvcFRoaXJ0eUZvdXI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdnBEaXN0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtVG9wVHdlbnR5OiBudW1Ub3BUd2VudHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcFR3ZW50eVBvd2VyOiB0b3BUd2VudHlQb3dlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtQm90dG9tRWlnaHR5OiBudW1Cb3R0b21FaWdodHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbUVpZ2h0eVBvd2VyOiBib3R0b21FaWdodHlQb3dlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtVG9wVGhpcnR5Rm91cjogbnVtVG9wVGhpcnR5Rm91cixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9wVGhpcnR5Rm91clBlcmNlbnQ6IHRvcFRoaXJ0eUZvdXJQZXJjZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1Cb3R0b21TaXh0eVNpeDogbnVtQm90dG9tU2l4dHlTaXgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvdHRvbVNpeHR5U2l4UGVyY2VudDogYm90dG9tU2l4dHlTaXhQZXJjZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1WYWxpZGF0b3JzOiBhY3RpdmVWYWxpZGF0b3JzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxWb3RpbmdQb3dlcjogYW5hbHl0aWNzRGF0YS52b3RpbmdfcG93ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrVGltZTogYmxvY2tEYXRhLnRpbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZUF0OiBuZXcgRGF0ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codnBEaXN0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZQRGlzdHJpYnV0aW9ucy5pbnNlcnQodnBEaXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgICAgICAgICBTWU5DSU5HID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlN0b3BwZWRcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGVuZEJsb2NrVGltZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUaGlzIGJsb2NrIHVzZWQ6IFwiKygoZW5kQmxvY2tUaW1lLXN0YXJ0QmxvY2tUaW1lKS8xMDAwKStcInNlY29uZHMuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgU1lOQ0lORyA9IGZhbHNlO1xuICAgICAgICAgICAgQ2hhaW4udXBkYXRlKHtjaGFpbklkOk1ldGVvci5zZXR0aW5ncy5wdWJsaWMuY2hhaW5JZH0sIHskc2V0OntsYXN0QmxvY2tzU3luY2VkVGltZTpuZXcgRGF0ZSgpLCB0b3RhbFZhbGlkYXRvcnM6dmFsaWRhdG9yU2V0Lmxlbmd0aH19KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bnRpbDtcbiAgICB9LFxuICAgICdhZGRMaW1pdCc6IGZ1bmN0aW9uKGxpbWl0KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGxpbWl0KzEwKVxuICAgICAgICByZXR1cm4gKGxpbWl0KzEwKTtcbiAgICB9LFxuICAgICdoYXNNb3JlJzogZnVuY3Rpb24obGltaXQpIHtcbiAgICAgICAgaWYgKGxpbWl0ID4gTWV0ZW9yLmNhbGwoJ2dldEN1cnJlbnRIZWlnaHQnKSkge1xuICAgICAgICAgICAgcmV0dXJuIChmYWxzZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gKHRydWUpO1xuICAgICAgICB9XG4gICAgfVxufSk7IiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBCbG9ja3Njb24gfSBmcm9tICcuLi9ibG9ja3MuanMnO1xuaW1wb3J0IHsgVmFsaWRhdG9ycyB9IGZyb20gJy4uLy4uL3ZhbGlkYXRvcnMvdmFsaWRhdG9ycy5qcyc7XG5pbXBvcnQgeyBUcmFuc2FjdGlvbnMgfSBmcm9tICcuLi8uLi90cmFuc2FjdGlvbnMvdHJhbnNhY3Rpb25zLmpzJztcblxucHVibGlzaENvbXBvc2l0ZSgnYmxvY2tzLmhlaWdodCcsIGZ1bmN0aW9uKGxpbWl0KXtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaW5kKCl7XG4gICAgICAgICAgICByZXR1cm4gQmxvY2tzY29uLmZpbmQoe30sIHtsaW1pdDogbGltaXQsIHNvcnQ6IHtoZWlnaHQ6IC0xfX0pXG4gICAgICAgIH0sXG4gICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmluZChibG9jayl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBWYWxpZGF0b3JzLmZpbmQoXG4gICAgICAgICAgICAgICAgICAgICAgICB7YWRkcmVzczpibG9jay5wcm9wb3NlckFkZHJlc3N9LFxuICAgICAgICAgICAgICAgICAgICAgICAge2xpbWl0OjF9XG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9XG59KTtcblxucHVibGlzaENvbXBvc2l0ZSgnYmxvY2tzLmZpbmRPbmUnLCBmdW5jdGlvbihoZWlnaHQpe1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbmQoKXtcbiAgICAgICAgICAgIHJldHVybiBCbG9ja3Njb24uZmluZCh7aGVpZ2h0OmhlaWdodH0pXG4gICAgICAgIH0sXG4gICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmluZChibG9jayl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBUcmFuc2FjdGlvbnMuZmluZChcbiAgICAgICAgICAgICAgICAgICAgICAgIHtoZWlnaHQ6YmxvY2suaGVpZ2h0fVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaW5kKGJsb2NrKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFZhbGlkYXRvcnMuZmluZChcbiAgICAgICAgICAgICAgICAgICAgICAgIHthZGRyZXNzOmJsb2NrLnByb3Bvc2VyQWRkcmVzc30sXG4gICAgICAgICAgICAgICAgICAgICAgICB7bGltaXQ6MX1cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH1cbn0pO1xuIiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgVmFsaWRhdG9ycyB9IGZyb20gJy4uL3ZhbGlkYXRvcnMvdmFsaWRhdG9ycy5qcyc7XG5cbmV4cG9ydCBjb25zdCBCbG9ja3Njb24gPSBuZXcgTW9uZ28uQ29sbGVjdGlvbignYmxvY2tzJyk7XG5cbkJsb2Nrc2Nvbi5oZWxwZXJzKHtcbiAgICBwcm9wb3Nlcigpe1xuICAgICAgICByZXR1cm4gVmFsaWRhdG9ycy5maW5kT25lKHthZGRyZXNzOnRoaXMucHJvcG9zZXJBZGRyZXNzfSk7XG4gICAgfVxufSk7XG5cbi8vIEJsb2Nrc2Nvbi5oZWxwZXJzKHtcbi8vICAgICBzb3J0ZWQobGltaXQpIHtcbi8vICAgICAgICAgcmV0dXJuIEJsb2Nrc2Nvbi5maW5kKHt9LCB7c29ydDoge2hlaWdodDotMX0sIGxpbWl0OiBsaW1pdH0pO1xuLy8gICAgIH1cbi8vIH0pO1xuXG5cbi8vIE1ldGVvci5zZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbi8vICAgICBNZXRlb3IuY2FsbCgnYmxvY2tzVXBkYXRlJywgKGVycm9yLCByZXN1bHQpID0+IHtcbi8vICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0KTtcbi8vICAgICB9KVxuLy8gfSwgMzAwMDAwMDApOyIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgSFRUUCB9IGZyb20gJ21ldGVvci9odHRwJztcbmltcG9ydCB7IGdldEFkZHJlc3MgfSBmcm9tICd0ZW5kZXJtaW50L2xpYi9wdWJrZXkuanMnO1xuaW1wb3J0IHsgQ2hhaW4sIENoYWluU3RhdGVzIH0gZnJvbSAnLi4vY2hhaW4uanMnO1xuaW1wb3J0IHsgVmFsaWRhdG9ycyB9IGZyb20gJy4uLy4uL3ZhbGlkYXRvcnMvdmFsaWRhdG9ycy5qcyc7XG5pbXBvcnQgeyBWb3RpbmdQb3dlckhpc3RvcnkgfSBmcm9tICcuLi8uLi92b3RpbmctcG93ZXIvaGlzdG9yeS5qcyc7XG5cbmZpbmRWb3RpbmdQb3dlciA9ICh2YWxpZGF0b3IsIGdlblZhbGlkYXRvcnMpID0+IHtcbiAgICBmb3IgKGxldCB2IGluIGdlblZhbGlkYXRvcnMpe1xuICAgICAgICBpZiAodmFsaWRhdG9yLnB1Yl9rZXkudmFsdWUgPT0gZ2VuVmFsaWRhdG9yc1t2XS5wdWJfa2V5LnZhbHVlKXtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUludChnZW5WYWxpZGF0b3JzW3ZdLnBvd2VyKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuTWV0ZW9yLm1ldGhvZHMoe1xuICAgICdjaGFpbi5nZXRDb25zZW5zdXNTdGF0ZSc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMudW5ibG9jaygpO1xuICAgICAgICBsZXQgdXJsID0gUlBDKycvZHVtcF9jb25zZW5zdXNfc3RhdGUnO1xuICAgICAgICB0cnl7XG4gICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgbGV0IGNvbnNlbnN1cyA9IEpTT04ucGFyc2UocmVzcG9uc2UuY29udGVudCk7XG4gICAgICAgICAgICBjb25zZW5zdXMgPSBjb25zZW5zdXMucmVzdWx0O1xuICAgICAgICAgICAgbGV0IGhlaWdodCA9IGNvbnNlbnN1cy5yb3VuZF9zdGF0ZS5oZWlnaHQ7XG4gICAgICAgICAgICBsZXQgcm91bmQgPSBjb25zZW5zdXMucm91bmRfc3RhdGUucm91bmQ7XG4gICAgICAgICAgICBsZXQgc3RlcCA9IGNvbnNlbnN1cy5yb3VuZF9zdGF0ZS5zdGVwO1xuICAgICAgICAgICAgbGV0IHZvdGVkUG93ZXIgPSBNYXRoLnJvdW5kKHBhcnNlRmxvYXQoY29uc2Vuc3VzLnJvdW5kX3N0YXRlLnZvdGVzW3JvdW5kXS5wcmV2b3Rlc19iaXRfYXJyYXkuc3BsaXQoXCIgXCIpWzNdKSoxMDApO1xuXG4gICAgICAgICAgICBDaGFpbi51cGRhdGUoe2NoYWluSWQ6TWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5jaGFpbklkfSwgeyRzZXQ6e1xuICAgICAgICAgICAgICAgIHZvdGluZ0hlaWdodDogaGVpZ2h0LCBcbiAgICAgICAgICAgICAgICB2b3RpbmdSb3VuZDogcm91bmQsIFxuICAgICAgICAgICAgICAgIHZvdGluZ1N0ZXA6IHN0ZXAsIFxuICAgICAgICAgICAgICAgIHZvdGVkUG93ZXI6IHZvdGVkUG93ZXIsXG4gICAgICAgICAgICAgICAgcHJvcG9zZXJBZGRyZXNzOiBjb25zZW5zdXMucm91bmRfc3RhdGUudmFsaWRhdG9ycy5wcm9wb3Nlci5hZGRyZXNzLFxuICAgICAgICAgICAgICAgIHByZXZvdGVzOiBjb25zZW5zdXMucm91bmRfc3RhdGUudm90ZXNbcm91bmRdLnByZXZvdGVzLFxuICAgICAgICAgICAgICAgIHByZWNvbW1pdHM6IGNvbnNlbnN1cy5yb3VuZF9zdGF0ZS52b3Rlc1tyb3VuZF0ucHJlY29tbWl0c1xuICAgICAgICAgICAgfX0pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGUpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgICdjaGFpbi51cGRhdGVTdGF0dXMnOiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLnVuYmxvY2soKTtcbiAgICAgICAgbGV0IHVybCA9IFJQQysnL3N0YXR1cyc7XG4gICAgICAgIHRyeXtcbiAgICAgICAgICAgIGxldCByZXNwb25zZSA9IEhUVFAuZ2V0KHVybCk7XG4gICAgICAgICAgICBsZXQgc3RhdHVzID0gSlNPTi5wYXJzZShyZXNwb25zZS5jb250ZW50KTtcbiAgICAgICAgICAgIHN0YXR1cyA9IHN0YXR1cy5yZXN1bHQ7XG4gICAgICAgICAgICBsZXQgY2hhaW4gPSB7fTtcbiAgICAgICAgICAgIGNoYWluLmNoYWluSWQgPSBzdGF0dXMubm9kZV9pbmZvLm5ldHdvcms7XG4gICAgICAgICAgICBjaGFpbi5sYXRlc3RCbG9ja0hlaWdodCA9IHN0YXR1cy5zeW5jX2luZm8ubGF0ZXN0X2Jsb2NrX2hlaWdodDtcbiAgICAgICAgICAgIGNoYWluLmxhdGVzdEJsb2NrVGltZSA9IHN0YXR1cy5zeW5jX2luZm8ubGF0ZXN0X2Jsb2NrX3RpbWU7XG5cbiAgICAgICAgICAgIHVybCA9IFJQQysnL3ZhbGlkYXRvcnMnO1xuICAgICAgICAgICAgcmVzcG9uc2UgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgbGV0IHZhbGlkYXRvcnMgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgdmFsaWRhdG9ycyA9IHZhbGlkYXRvcnMucmVzdWx0LnZhbGlkYXRvcnM7XG4gICAgICAgICAgICBjaGFpbi52YWxpZGF0b3JzID0gdmFsaWRhdG9ycy5sZW5ndGg7XG4gICAgICAgICAgICBsZXQgYWN0aXZlVlAgPSAwO1xuICAgICAgICAgICAgZm9yICh2IGluIHZhbGlkYXRvcnMpe1xuICAgICAgICAgICAgICAgIGFjdGl2ZVZQICs9IHBhcnNlSW50KHZhbGlkYXRvcnNbdl0udm90aW5nX3Bvd2VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoYWluLmFjdGl2ZVZvdGluZ1Bvd2VyID0gYWN0aXZlVlA7XG5cbiAgICAgICAgICAgIC8vIEdldCBjaGFpbiBzdGF0ZXNcbiAgICAgICAgICAgIGlmIChwYXJzZUludChjaGFpbi5sYXRlc3RCbG9ja0hlaWdodCkgPiAwKXtcbiAgICAgICAgICAgICAgICBsZXQgY2hhaW5TdGF0ZXMgPSB7fTtcbiAgICAgICAgICAgICAgICBjaGFpblN0YXRlcy5oZWlnaHQgPSBwYXJzZUludChzdGF0dXMuc3luY19pbmZvLmxhdGVzdF9ibG9ja19oZWlnaHQpO1xuICAgICAgICAgICAgICAgIGNoYWluU3RhdGVzLnRpbWUgPSBuZXcgRGF0ZShzdGF0dXMuc3luY19pbmZvLmxhdGVzdF9ibG9ja190aW1lKTtcblxuICAgICAgICAgICAgICAgIHVybCA9IExDRCArICcvc3Rha2luZy9wb29sJztcbiAgICAgICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJvbmRpbmcgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAvLyBjaGFpbi5ib25kZWRUb2tlbnMgPSBib25kaW5nLmJvbmRlZF90b2tlbnM7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNoYWluLm5vdEJvbmRlZFRva2VucyA9IGJvbmRpbmcubm90X2JvbmRlZF90b2tlbnM7XG4gICAgICAgICAgICAgICAgICAgIGNoYWluU3RhdGVzLmJvbmRlZFRva2VucyA9IHBhcnNlSW50KGJvbmRpbmcuYm9uZGVkX3Rva2Vucyk7XG4gICAgICAgICAgICAgICAgICAgIGNoYWluU3RhdGVzLm5vdEJvbmRlZFRva2VucyA9IHBhcnNlSW50KGJvbmRpbmcubm90X2JvbmRlZF90b2tlbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaChlKXtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdXJsID0gTENEICsgJy9kaXN0cmlidXRpb24vY29tbXVuaXR5X3Bvb2wnO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBvb2wgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9vbCAmJiBwb29sLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhaW5TdGF0ZXMuY29tbXVuaXR5UG9vbCA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9vbC5mb3JFYWNoKChhbW91bnQsIGkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFpblN0YXRlcy5jb21tdW5pdHlQb29sLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZW5vbTogYW1vdW50LmRlbm9tLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbW91bnQ6IHBhcnNlRmxvYXQoYW1vdW50LmFtb3VudClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdXJsID0gTENEICsgJy9taW50aW5nL2luZmxhdGlvbic7XG4gICAgICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IEhUVFAuZ2V0KHVybCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpbmZsYXRpb24gPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mbGF0aW9uKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYWluU3RhdGVzLmluZmxhdGlvbiA9IHBhcnNlRmxvYXQoaW5mbGF0aW9uKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoKGUpe1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB1cmwgPSBMQ0QgKyAnL21pbnRpbmcvZGVmbGF0aW9uJztcbiAgICAgICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlZmxhdGlvbiA9IEpTT04ucGFyc2UocmVzcG9uc2UuY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWZsYXRpb24pe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhaW5TdGF0ZXMuZGVmbGF0aW9uID0gcGFyc2VGbG9hdChkZWZsYXRpb24pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2goZSl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHVybCA9IExDRCArICcvbWludGluZy9taW50aW5nLXNwZWVkJztcbiAgICAgICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1pbnRpbmcgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWludGluZyl7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFpblN0YXRlcy5taW50aW5nID0gcGFyc2VGbG9hdChtaW50aW5nKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoKGUpe1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB1cmwgPSBMQ0QgKyAnL21pbnRpbmcvYW5udWFsLXByb3Zpc2lvbnMnO1xuICAgICAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcHJvdmlzaW9ucyA9IEpTT04ucGFyc2UocmVzcG9uc2UuY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm92aXNpb25zKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYWluU3RhdGVzLmFubnVhbFByb3Zpc2lvbnMgPSBwYXJzZUZsb2F0KHByb3Zpc2lvbnMpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2goZSl7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIENoYWluU3RhdGVzLmluc2VydChjaGFpblN0YXRlcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNoYWluLnRvdGFsVm90aW5nUG93ZXIgPSB0b3RhbFZQO1xuXG4gICAgICAgICAgICBDaGFpbi51cGRhdGUoe2NoYWluSWQ6Y2hhaW4uY2hhaW5JZH0sIHskc2V0OmNoYWlufSwge3Vwc2VydDogdHJ1ZX0pO1xuXG4gICAgICAgICAgICAvLyB2YWxpZGF0b3JzID0gVmFsaWRhdG9ycy5maW5kKHt9KS5mZXRjaCgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2codmFsaWRhdG9ycyk7XG4gICAgICAgICAgICByZXR1cm4gY2hhaW4ubGF0ZXN0QmxvY2tIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgICAgICByZXR1cm4gXCJFcnJvciBnZXR0aW5nIGNoYWluIHN0YXR1cy5cIjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgJ2NoYWluLmdldExhdGVzdFN0YXR1cyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIENoYWluLmZpbmQoKS5zb3J0KHtjcmVhdGVkOi0xfSkubGltaXQoMSk7XG4gICAgfSxcbiAgICAnY2hhaW4uZ2VuZXNpcyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBjaGFpbiA9IENoYWluLmZpbmRPbmUoe2NoYWluSWQ6IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuY2hhaW5JZH0pO1xuICAgICAgICBcbiAgICAgICAgaWYgKGNoYWluICYmIGNoYWluLnJlYWRHZW5lc2lzKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdHZW5lc2lzIGZpbGUgaGFzIGJlZW4gcHJvY2Vzc2VkJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCc9PT0gU3RhcnQgcHJvY2Vzc2luZyBnZW5lc2lzIGZpbGUgPT09Jyk7XG5cbiAgICAgICAgICAgIGxldCByZXNwb25zZSA9IEhUVFAuZ2V0KE1ldGVvci5zZXR0aW5ncy5nZW5lc2lzRmlsZSk7XG4gICAgICAgICAgICBsZXQgZ2VuZXNpcyA9IEpTT04ucGFyc2UocmVzcG9uc2UuY29udGVudCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhnZW5lc2lzLnJlc3VsdC5nZW5lc2lzKVxuICAgICAgICAgICAgZ2VuZXNpcyA9IGdlbmVzaXMucmVzdWx0LmdlbmVzaXNcbiAgICAgICAgICAgIGxldCBjaGFpblBhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICBjaGFpbklkOiBnZW5lc2lzLmNoYWluX2lkLFxuICAgICAgICAgICAgICAgIGdlbmVzaXNUaW1lOiBnZW5lc2lzLmdlbmVzaXNfdGltZSxcbiAgICAgICAgICAgICAgICBjb25zZW5zdXNQYXJhbXM6IGdlbmVzaXMuY29uc2Vuc3VzX3BhcmFtcyxcbiAgICAgICAgICAgICAgICBhdXRoOiBnZW5lc2lzLmFwcF9zdGF0ZS5hdXRoLFxuICAgICAgICAgICAgICAgIGJhbms6IGdlbmVzaXMuYXBwX3N0YXRlLmJhbmssXG4gICAgICAgICAgICAgICAgc3Rha2luZzoge1xuICAgICAgICAgICAgICAgICAgICBwb29sOiBnZW5lc2lzLmFwcF9zdGF0ZS5zdGFraW5nLnBvb2wsXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtczogZ2VuZXNpcy5hcHBfc3RhdGUuc3Rha2luZy5wYXJhbXNcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1pbnQ6IGdlbmVzaXMuYXBwX3N0YXRlLm1pbnQsXG4gICAgICAgICAgICAgICAgZGlzdHI6IHtcbiAgICAgICAgICAgICAgICAgICAgY29tbXVuaXR5VGF4OiBnZW5lc2lzLmFwcF9zdGF0ZS5kaXN0ci5jb21tdW5pdHlfdGF4LFxuICAgICAgICAgICAgICAgICAgICBiYXNlUHJvcG9zZXJSZXdhcmQ6IGdlbmVzaXMuYXBwX3N0YXRlLmRpc3RyLmJhc2VfcHJvcG9zZXJfcmV3YXJkLFxuICAgICAgICAgICAgICAgICAgICBib251c1Byb3Bvc2VyUmV3YXJkOiBnZW5lc2lzLmFwcF9zdGF0ZS5kaXN0ci5ib251c19wcm9wb3Nlcl9yZXdhcmQsXG4gICAgICAgICAgICAgICAgICAgIHdpdGhkcmF3QWRkckVuYWJsZWQ6IGdlbmVzaXMuYXBwX3N0YXRlLmRpc3RyLndpdGhkcmF3X2FkZHJfZW5hYmxlZFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZ292OiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0aW5nUHJvcG9zYWxJZDogZ2VuZXNpcy5hcHBfc3RhdGUuZ292LnN0YXJ0aW5nX3Byb3Bvc2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBkZXBvc2l0UGFyYW1zOiBnZW5lc2lzLmFwcF9zdGF0ZS5nb3YuZGVwb3NpdF9wYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgIHZvdGluZ1BhcmFtczogZ2VuZXNpcy5hcHBfc3RhdGUuZ292LnZvdGluZ19wYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgIHRhbGx5UGFyYW1zOiBnZW5lc2lzLmFwcF9zdGF0ZS5nb3YudGFsbHlfcGFyYW1zXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzbGFzaGluZzp7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtczogZ2VuZXNpcy5hcHBfc3RhdGUuc2xhc2hpbmcucGFyYW1zXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgdG90YWxWb3RpbmdQb3dlciA9IDA7XG5cbiAgICAgICAgICAgIC8vIHJlYWQgZ2VudHhcbiAgICAgICAgICAgIGlmIChnZW5lc2lzLmFwcF9zdGF0ZS5nZW50eHMgJiYgKGdlbmVzaXMuYXBwX3N0YXRlLmdlbnR4cy5sZW5ndGggPiAwKSl7XG4gICAgICAgICAgICAgICAgZm9yIChpIGluIGdlbmVzaXMuYXBwX3N0YXRlLmdlbnR4cyl7XG4gICAgICAgICAgICAgICAgICAgIGxldCBtc2cgPSBnZW5lc2lzLmFwcF9zdGF0ZS5nZW50eHNbaV0udmFsdWUubXNnO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhtc2cudHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobSBpbiBtc2cpe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1zZ1ttXS50eXBlID09IFwiY29zbW9zLXNkay9Nc2dDcmVhdGVWYWxpZGF0b3JcIil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cobXNnW21dLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsZXQgY29tbWFuZCA9IE1ldGVvci5zZXR0aW5ncy5iaW4uZ2FpYWRlYnVnK1wiIHB1YmtleSBcIittc2dbbV0udmFsdWUucHVia2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWxpZGF0b3IgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNlbnN1c19wdWJrZXk6IG1zZ1ttXS52YWx1ZS5wdWJrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBtc2dbbV0udmFsdWUuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1pc3Npb246IG1zZ1ttXS52YWx1ZS5jb21taXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5fc2VsZl9kZWxlZ2F0aW9uOiBtc2dbbV0udmFsdWUubWluX3NlbGZfZGVsZWdhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3JfYWRkcmVzczogbXNnW21dLnZhbHVlLnZhbGlkYXRvcl9hZGRyZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0b3JfYWRkcmVzczogbXNnW21dLnZhbHVlLmRlbGVnYXRvcl9hZGRyZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b3RpbmdfcG93ZXI6IE1hdGguZmxvb3IocGFyc2VJbnQobXNnW21dLnZhbHVlLnZhbHVlLmFtb3VudCkgLyBNZXRlb3Iuc2V0dGluZ3MucHVibGljLnN0YWtpbmdGcmFjdGlvbiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGphaWxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsVm90aW5nUG93ZXIgKz0gdmFsaWRhdG9yLnZvdGluZ19wb3dlcjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwdWJrZXlWYWx1ZSA9IE1ldGVvci5jYWxsKCdiZWNoMzJUb1B1YmtleScsIG1zZ1ttXS52YWx1ZS5wdWJrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZhbGlkYXRvcnMudXBzZXJ0KHtjb25zZW5zdXNfcHVia2V5Om1zZ1ttXS52YWx1ZS5wdWJrZXl9LHZhbGlkYXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLnB1Yl9rZXkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOlwidGVuZGVybWludC9QdWJLZXlFZDI1NTE5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjpwdWJrZXlWYWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5hZGRyZXNzID0gZ2V0QWRkcmVzcyh2YWxpZGF0b3IucHViX2tleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLmFjY3B1YiA9IE1ldGVvci5jYWxsKCdwdWJrZXlUb0JlY2gzMicsIHZhbGlkYXRvci5wdWJfa2V5LCBNZXRlb3Iuc2V0dGluZ3MucHVibGljLmJlY2gzMlByZWZpeEFjY1B1Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLm9wZXJhdG9yX3B1YmtleSA9IE1ldGVvci5jYWxsKCdwdWJrZXlUb0JlY2gzMicsIHZhbGlkYXRvci5wdWJfa2V5LCBNZXRlb3Iuc2V0dGluZ3MucHVibGljLmJlY2gzMlByZWZpeFZhbFB1Yik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVm90aW5nUG93ZXJIaXN0b3J5Lmluc2VydCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZHJlc3M6IHZhbGlkYXRvci5hZGRyZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2X3ZvdGluZ19wb3dlcjogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdm90aW5nX3Bvd2VyOiB2YWxpZGF0b3Iudm90aW5nX3Bvd2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYWRkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja190aW1lOiBnZW5lc2lzLmdlbmVzaXNfdGltZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVmFsaWRhdG9ycy5pbnNlcnQodmFsaWRhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcmVhZCB2YWxpZGF0b3JzIGZyb20gcHJldmlvdXMgY2hhaW5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZWFkIHZhbGlkYXRvcnMgZnJvbSBwcmV2aW91cyBjaGFpbicpO1xuICAgICAgICAgICAgaWYgKGdlbmVzaXMuYXBwX3N0YXRlLnN0YWtpbmcudmFsaWRhdG9ycyAmJiBnZW5lc2lzLmFwcF9zdGF0ZS5zdGFraW5nLnZhbGlkYXRvcnMubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2VuZXNpcy5hcHBfc3RhdGUuc3Rha2luZy52YWxpZGF0b3JzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgbGV0IGdlblZhbGlkYXRvcnNTZXQgPSBnZW5lc2lzLmFwcF9zdGF0ZS5zdGFraW5nLnZhbGlkYXRvcnM7XG4gICAgICAgICAgICAgICAgbGV0IGdlblZhbGlkYXRvcnMgPSBnZW5lc2lzLnZhbGlkYXRvcnM7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgdiBpbiBnZW5WYWxpZGF0b3JzU2V0KXtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZ2VuVmFsaWRhdG9yc1t2XSk7XG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWxpZGF0b3IgPSBnZW5WYWxpZGF0b3JzU2V0W3ZdO1xuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3IuZGVsZWdhdG9yX2FkZHJlc3MgPSBNZXRlb3IuY2FsbCgnZ2V0RGVsZWdhdG9yJywgZ2VuVmFsaWRhdG9yc1NldFt2XS5vcGVyYXRvcl9hZGRyZXNzKTtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgcHVia2V5VmFsdWUgPSBNZXRlb3IuY2FsbCgnYmVjaDMyVG9QdWJrZXknLCB2YWxpZGF0b3IuY29uc2Vuc3VzX3B1YmtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5wdWJfa2V5ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6XCJ0ZW5kZXJtaW50L1B1YktleUVkMjU1MTlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjpwdWJrZXlWYWx1ZVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLmFkZHJlc3MgPSBnZXRBZGRyZXNzKHZhbGlkYXRvci5wdWJfa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLnB1Yl9rZXkgPSB2YWxpZGF0b3IucHViX2tleTtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLmFjY3B1YiA9IE1ldGVvci5jYWxsKCdwdWJrZXlUb0JlY2gzMicsIHZhbGlkYXRvci5wdWJfa2V5LCBNZXRlb3Iuc2V0dGluZ3MucHVibGljLmJlY2gzMlByZWZpeEFjY1B1Yik7XG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci5vcGVyYXRvcl9wdWJrZXkgPSBNZXRlb3IuY2FsbCgncHVia2V5VG9CZWNoMzInLCB2YWxpZGF0b3IucHViX2tleSwgTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5iZWNoMzJQcmVmaXhWYWxQdWIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvci52b3RpbmdfcG93ZXIgPSBmaW5kVm90aW5nUG93ZXIodmFsaWRhdG9yLCBnZW5WYWxpZGF0b3JzKTtcbiAgICAgICAgICAgICAgICAgICAgdG90YWxWb3RpbmdQb3dlciArPSB2YWxpZGF0b3Iudm90aW5nX3Bvd2VyO1xuXG4gICAgICAgICAgICAgICAgICAgIFZhbGlkYXRvcnMudXBzZXJ0KHtjb25zZW5zdXNfcHVia2V5OnZhbGlkYXRvci5jb25zZW5zdXNfcHVia2V5fSx2YWxpZGF0b3IpO1xuICAgICAgICAgICAgICAgICAgICBWb3RpbmdQb3dlckhpc3RvcnkuaW5zZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZHJlc3M6IHZhbGlkYXRvci5hZGRyZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldl92b3RpbmdfcG93ZXI6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB2b3RpbmdfcG93ZXI6IHZhbGlkYXRvci52b3RpbmdfcG93ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYWRkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrX3RpbWU6IGdlbmVzaXMuZ2VuZXNpc190aW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNoYWluUGFyYW1zLnJlYWRHZW5lc2lzID0gdHJ1ZTtcbiAgICAgICAgICAgIGNoYWluUGFyYW1zLmFjdGl2ZVZvdGluZ1Bvd2VyID0gdG90YWxWb3RpbmdQb3dlcjtcbiAgICAgICAgICAgIGxldCByZXN1bHQgPSBDaGFpbi51cHNlcnQoe2NoYWluSWQ6Y2hhaW5QYXJhbXMuY2hhaW5JZH0sIHskc2V0OmNoYWluUGFyYW1zfSk7XG5cblxuICAgICAgICAgICAgY29uc29sZS5sb2coJz09PSBGaW5pc2hlZCBwcm9jZXNzaW5nIGdlbmVzaXMgZmlsZSA9PT0nKTtcblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59KSIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgQ2hhaW4sIENoYWluU3RhdGVzIH0gZnJvbSAnLi4vY2hhaW4uanMnO1xuaW1wb3J0IHsgQ29pblN0YXRzIH0gZnJvbSAnLi4vLi4vY29pbi1zdGF0cy9jb2luLXN0YXRzLmpzJztcbmltcG9ydCB7IFZhbGlkYXRvcnMgfSBmcm9tICcuLi8uLi92YWxpZGF0b3JzL3ZhbGlkYXRvcnMuanMnO1xuXG5NZXRlb3IucHVibGlzaCgnY2hhaW5TdGF0ZXMubGF0ZXN0JywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgIENoYWluU3RhdGVzLmZpbmQoe30se3NvcnQ6e2hlaWdodDotMX0sbGltaXQ6MX0pLFxuICAgICAgICBDb2luU3RhdHMuZmluZCh7fSx7c29ydDp7bGFzdF91cGRhdGVkX2F0Oi0xfSxsaW1pdDoxfSlcbiAgICBdO1xufSk7XG5cbnB1Ymxpc2hDb21wb3NpdGUoJ2NoYWluLnN0YXR1cycsIGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmluZCgpe1xuICAgICAgICAgICAgcmV0dXJuIENoYWluLmZpbmQoe2NoYWluSWQ6TWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5jaGFpbklkfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmluZChjaGFpbil7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBWYWxpZGF0b3JzLmZpbmQoXG4gICAgICAgICAgICAgICAgICAgICAgICB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmaWVsZHM6e2FkZHJlc3M6MSwgZGVzY3JpcHRpb246MX19XG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9XG59KTsiLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBWYWxpZGF0b3JzIH0gZnJvbSAnLi4vdmFsaWRhdG9ycy92YWxpZGF0b3JzLmpzJztcblxuZXhwb3J0IGNvbnN0IENoYWluID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ2NoYWluJyk7XG5leHBvcnQgY29uc3QgQ2hhaW5TdGF0ZXMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbignY2hhaW5fc3RhdGVzJylcblxuQ2hhaW4uaGVscGVycyh7XG4gICAgcHJvcG9zZXIoKXtcbiAgICAgICAgcmV0dXJuIFZhbGlkYXRvcnMuZmluZE9uZSh7YWRkcmVzczp0aGlzLnByb3Bvc2VyQWRkcmVzc30pO1xuICAgIH1cbn0pIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBDb2luU3RhdHMgfSBmcm9tICcuLi9jb2luLXN0YXRzLmpzJztcbmltcG9ydCB7IEhUVFAgfSBmcm9tICdtZXRlb3IvaHR0cCc7XG5cbk1ldGVvci5tZXRob2RzKHtcbiAgICAnY29pblN0YXRzLmdldENvaW5TdGF0cyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMudW5ibG9jaygpO1xuICAgICAgICBsZXQgY29pbklkID0gTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5jb2luZ2Vja29JZDtcbiAgICAgICAgaWYgKGNvaW5JZCl7XG4gICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgbGV0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgbm93LnNldE1pbnV0ZXMoMCk7XG4gICAgICAgICAgICAgICAgbGV0IHVybCA9IFwiaHR0cHM6Ly9hcGkuY29pbmdlY2tvLmNvbS9hcGkvdjMvc2ltcGxlL3ByaWNlP2lkcz1cIitjb2luSWQrXCImdnNfY3VycmVuY2llcz11c2QmaW5jbHVkZV9tYXJrZXRfY2FwPXRydWUmaW5jbHVkZV8yNGhyX3ZvbD10cnVlJmluY2x1ZGVfMjRocl9jaGFuZ2U9dHJ1ZSZpbmNsdWRlX2xhc3RfdXBkYXRlZF9hdD10cnVlXCI7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3BvbnNlID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA9PSAyMDApe1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRhdGEgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICBkYXRhID0gZGF0YVtjb2luSWRdO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhjb2luU3RhdHMpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQ29pblN0YXRzLmluc2VydChkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaChlKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgcmV0dXJuIFwiTm8gY29pbmdlY2tvIElkIHByb3ZpZGVkLlwiXG4gICAgICAgIH1cbiAgICB9LFxuICAgICdjb2luU3RhdHMuZ2V0U3RhdHMnOiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLnVuYmxvY2soKTtcbiAgICAgICAgbGV0IGNvaW5JZCA9IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuY29pbmdlY2tvSWQ7XG4gICAgICAgIGlmIChjb2luSWQpe1xuICAgICAgICAgICAgcmV0dXJuIChDb2luU3RhdHMuZmluZE9uZSh7fSx7c29ydDp7bGFzdF91cGRhdGVkX2F0Oi0xfX0pKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgcmV0dXJuIFwiTm8gY29pbmdlY2tvIElkIHByb3ZpZGVkLlwiO1xuICAgICAgICB9XG5cbiAgICB9XG59KSIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcblxuZXhwb3J0IGNvbnN0IENvaW5TdGF0cyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCdjb2luX3N0YXRzJyk7XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IERlbGVnYXRpb25zIH0gZnJvbSAnLi4vZGVsZWdhdGlvbnMuanMnO1xuaW1wb3J0IHsgVmFsaWRhdG9ycyB9IGZyb20gJy4uLy4uL3ZhbGlkYXRvcnMvdmFsaWRhdG9ycy5qcyc7XG5cbk1ldGVvci5tZXRob2RzKHtcbiAgICAnZGVsZWdhdGlvbnMuZ2V0RGVsZWdhdGlvbnMnOiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLnVuYmxvY2soKTtcbiAgICAgICAgbGV0IHZhbGlkYXRvcnMgPSBWYWxpZGF0b3JzLmZpbmQoe30pLmZldGNoKCk7XG4gICAgICAgIGxldCBkZWxlZ2F0aW9ucyA9IFtdO1xuICAgICAgICBjb25zb2xlLmxvZyhcIj09PSBHZXR0aW5nIGRlbGVnYXRpb25zID09PVwiKTtcbiAgICAgICAgZm9yICh2IGluIHZhbGlkYXRvcnMpe1xuICAgICAgICAgICAgaWYgKHZhbGlkYXRvcnNbdl0ub3BlcmF0b3JfYWRkcmVzcyl7XG4gICAgICAgICAgICAgICAgbGV0IHVybCA9IExDRCArICcvc3Rha2luZy92YWxpZGF0b3JzLycrdmFsaWRhdG9yc1t2XS5vcGVyYXRvcl9hZGRyZXNzK1wiL2RlbGVnYXRpb25zXCI7XG4gICAgICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA9PSAyMDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGRlbGVnYXRpb24gPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZGVsZWdhdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0aW9ucyA9IGRlbGVnYXRpb25zLmNvbmNhdChkZWxlZ2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2Uuc3RhdHVzQ29kZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpe1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgICAgICB9ICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpIGluIGRlbGVnYXRpb25zKXtcbiAgICAgICAgICAgIGlmIChkZWxlZ2F0aW9uc1tpXSAmJiBkZWxlZ2F0aW9uc1tpXS5zaGFyZXMpXG4gICAgICAgICAgICAgICAgZGVsZWdhdGlvbnNbaV0uc2hhcmVzID0gcGFyc2VGbG9hdChkZWxlZ2F0aW9uc1tpXS5zaGFyZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coZGVsZWdhdGlvbnMpO1xuICAgICAgICBsZXQgZGF0YSA9IHtcbiAgICAgICAgICAgIGRlbGVnYXRpb25zOiBkZWxlZ2F0aW9ucyxcbiAgICAgICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBEZWxlZ2F0aW9ucy5pbnNlcnQoZGF0YSk7XG4gICAgfVxuICAgIC8vICdibG9ja3MuYXZlcmFnZUJsb2NrVGltZScoYWRkcmVzcyl7XG4gICAgLy8gICAgIGxldCBibG9ja3MgPSBCbG9ja3Njb24uZmluZCh7cHJvcG9zZXJBZGRyZXNzOmFkZHJlc3N9KS5mZXRjaCgpO1xuICAgIC8vICAgICBsZXQgaGVpZ2h0cyA9IGJsb2Nrcy5tYXAoKGJsb2NrLCBpKSA9PiB7XG4gICAgLy8gICAgICAgICByZXR1cm4gYmxvY2suaGVpZ2h0O1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgICAgbGV0IGJsb2Nrc1N0YXRzID0gQW5hbHl0aWNzLmZpbmQoe2hlaWdodDp7JGluOmhlaWdodHN9fSkuZmV0Y2goKTtcbiAgICAvLyAgICAgLy8gY29uc29sZS5sb2coYmxvY2tzU3RhdHMpO1xuXG4gICAgLy8gICAgIGxldCB0b3RhbEJsb2NrRGlmZiA9IDA7XG4gICAgLy8gICAgIGZvciAoYiBpbiBibG9ja3NTdGF0cyl7XG4gICAgLy8gICAgICAgICB0b3RhbEJsb2NrRGlmZiArPSBibG9ja3NTdGF0c1tiXS50aW1lRGlmZjtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICByZXR1cm4gdG90YWxCbG9ja0RpZmYvaGVpZ2h0cy5sZW5ndGg7XG4gICAgLy8gfVxufSkiLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5cbmV4cG9ydCBjb25zdCBEZWxlZ2F0aW9ucyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCdkZWxlZ2F0aW9ucycpO1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBIVFRQIH0gZnJvbSAnbWV0ZW9yL2h0dHAnO1xuaW1wb3J0IHsgRnVuZGluZ0N5Y2xlc3MgfSBmcm9tICcuLi9mdW5kaW5nY3ljbGVzLmpzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICAgICdGdW5kaW5nQ3ljbGVzLmdldEZ1bmRpbmdDeWNsZXMnOiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLnVuYmxvY2soKTtcbiAgICAgICAgdHJ5e1xuICAgICAgICAgICAgbGV0IHVybCA9IExDRCArICcvZ292L2Z1bmRpbmdjeWNsZXMnO1xuICAgICAgICAgICAgbGV0IHJlc3BvbnNlID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgIGxldCBGdW5kaW5nQ3ljbGVzID0gSlNPTi5wYXJzZShyZXNwb25zZS5jb250ZW50KTtcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coRnVuZGluZ0N5Y2xlcyk7XG5cbiAgICAgICAgICAgIGxldCBGdW5kaW5nQ3ljbGVJZHMgPSBbXTtcbiAgICAgICAgICAgIGlmIChGdW5kaW5nQ3ljbGVzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgIC8vIEZ1bmRpbmdDeWNsZXMudXBzZXJ0KClcbiAgICAgICAgICAgICAgICBjb25zdCBidWxrRnVuZGluZ0N5Y2xlcyA9IEZ1bmRpbmdDeWNsZXNzLnJhd0NvbGxlY3Rpb24oKS5pbml0aWFsaXplVW5vcmRlcmVkQnVsa09wKCk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSBpbiBGdW5kaW5nQ3ljbGVzKXtcbiAgICAgICAgICAgICAgICAgICAgbGV0IEZ1bmRpbmdDeWNsZSA9IEZ1bmRpbmdDeWNsZXNbaV07XG4gICAgICAgICAgICAgICAgICAgIEZ1bmRpbmdDeWNsZS5jeWNsZUlkID0gcGFyc2VJbnQoRnVuZGluZ0N5Y2xlLmN5Y2xlX2lkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEZ1bmRpbmdDeWNsZS5jeWNsZUlkID49IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB1cmwgPSBMQ0QgKyAnL2dvdi9mdW5kaW5nY3ljbGVzLycrRnVuZGluZ0N5Y2xlLmN5Y2xlSWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlc3BvbnNlID0gSFRUUC5nZXQodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA9PSAyMDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvcG9zZXIgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcG9zZXIuY3ljbGVfaWQgJiYgKHByb3Bvc2VyLmN5Y2xlX2lkID09IEZ1bmRpbmdDeWNsZS5jeWNsZV9pZCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRnVuZGluZ0N5Y2xlLnByb3Bvc2VyID0gcHJvcG9zZXIucHJvcG9zZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVsa0Z1bmRpbmdDeWNsZXMuZmluZCh7Y3ljbGVJZDogRnVuZGluZ0N5Y2xlLmN5Y2xlSWR9KS51cHNlcnQoKS51cGRhdGVPbmUoeyRzZXQ6RnVuZGluZ0N5Y2xlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRnVuZGluZ0N5Y2xlSWRzLnB1c2goRnVuZGluZ0N5Y2xlLmN5Y2xlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2goZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVsa0Z1bmRpbmdDeWNsZXMuZmluZCh7Y3ljbGVJZDogRnVuZGluZ0N5Y2xlLmN5Y2xlSWR9KS51cHNlcnQoKS51cGRhdGVPbmUoeyRzZXQ6RnVuZGluZ0N5Y2xlfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRnVuZGluZ0N5Y2xlSWRzLnB1c2goRnVuZGluZ0N5Y2xlLmN5Y2xlSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUucmVzcG9uc2UuY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYnVsa0Z1bmRpbmdDeWNsZXMuZmluZCh7Y3ljbGVJZDp7JG5pbjpGdW5kaW5nQ3ljbGVJZHN9fSkudXBkYXRlKHskc2V0OntcInZhbHVlLnByb3Bvc2FsX3N0YXR1c1wiOlwiUmVtb3ZlZFwifX0pO1xuICAgICAgICAgICAgICAgIGJ1bGtGdW5kaW5nQ3ljbGVzLmV4ZWN1dGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgfVxuICAgIH0sXG59KSIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgRnVuZGluZ0N5Y2xlc3MgfSBmcm9tICcuLi9mdW5kaW5nY3ljbGVzLmpzJztcbmltcG9ydCB7IGNoZWNrIH0gZnJvbSAnbWV0ZW9yL2NoZWNrJ1xuXG5NZXRlb3IucHVibGlzaCgnZnVuZGluZ2N5Y2xlcy5saXN0JywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBGdW5kaW5nQ3ljbGVzcy5maW5kKHt9LCB7c29ydDp7Y3ljbGVJZDotMX19KTtcbn0pO1xuXG5NZXRlb3IucHVibGlzaCgnZnVuZGluZ2N5Y2xlcy5vbmUnLCBmdW5jdGlvbiAoaWQpe1xuICAgIGNoZWNrKGlkLCBOdW1iZXIpO1xuICAgIHJldHVybiBGdW5kaW5nQ3ljbGVzcy5maW5kKHtjeWNsZUlkOmlkfSk7XG59KSIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcblxuZXhwb3J0IGNvbnN0IEZ1bmRpbmdDeWNsZXNzID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ2Z1bmRpbmdjeWNsZXMnKTtcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgSFRUUCB9IGZyb20gJ21ldGVvci9odHRwJztcbmltcG9ydCB7IFByb3Bvc2FscyB9IGZyb20gJy4uL3Byb3Bvc2Fscy5qcyc7XG5pbXBvcnQgeyBWYWxpZGF0b3JzIH0gZnJvbSAnLi4vLi4vdmFsaWRhdG9ycy92YWxpZGF0b3JzLmpzJztcbi8vIGltcG9ydCB7IFByb21pc2UgfSBmcm9tICdtZXRlb3IvcHJvbWlzZSc7XG5cbk1ldGVvci5tZXRob2RzKHtcbiAgICAncHJvcG9zYWxzLmdldFByb3Bvc2Fscyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMudW5ibG9jaygpO1xuICAgICAgICB0cnl7XG4gICAgICAgICAgICBsZXQgdXJsID0gTENEICsgJy9nb3YvcHJvcG9zYWxzJztcbiAgICAgICAgICAgIGxldCByZXNwb25zZSA9IEhUVFAuZ2V0KHVybCk7XG4gICAgICAgICAgICBsZXQgcHJvcG9zYWxzID0gSlNPTi5wYXJzZShyZXNwb25zZS5jb250ZW50KTtcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocHJvcG9zYWxzKTtcblxuICAgICAgICAgICAgbGV0IHByb3Bvc2FsSWRzID0gW107XG4gICAgICAgICAgICBpZiAocHJvcG9zYWxzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgIC8vIFByb3Bvc2Fscy51cHNlcnQoKVxuICAgICAgICAgICAgICAgIGNvbnN0IGJ1bGtQcm9wb3NhbHMgPSBQcm9wb3NhbHMucmF3Q29sbGVjdGlvbigpLmluaXRpYWxpemVVbm9yZGVyZWRCdWxrT3AoKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpIGluIHByb3Bvc2Fscyl7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwcm9wb3NhbCA9IHByb3Bvc2Fsc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgcHJvcG9zYWwucHJvcG9zYWxJZCA9IHBhcnNlSW50KHByb3Bvc2FsLnByb3Bvc2FsX2lkKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByb3Bvc2FsLnByb3Bvc2FsSWQgPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdXJsID0gTENEICsgJy9nb3YvcHJvcG9zYWxzLycrcHJvcG9zYWwucHJvcG9zYWxJZCsnL3Byb3Bvc2VyJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlID09IDIwMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBwcm9wb3NlciA9IEpTT04ucGFyc2UocmVzcG9uc2UuY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wb3Nlci5wcm9wb3NhbF9pZCAmJiAocHJvcG9zZXIucHJvcG9zYWxfaWQgPT0gcHJvcG9zYWwucHJvcG9zYWxfaWQpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2FsLnByb3Bvc2VyID0gcHJvcG9zZXIucHJvcG9zZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnVsa1Byb3Bvc2Fscy5maW5kKHtwcm9wb3NhbElkOiBwcm9wb3NhbC5wcm9wb3NhbElkfSkudXBzZXJ0KCkudXBkYXRlT25lKHskc2V0OnByb3Bvc2FsfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcG9zYWxJZHMucHVzaChwcm9wb3NhbC5wcm9wb3NhbElkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoKGUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1bGtQcm9wb3NhbHMuZmluZCh7cHJvcG9zYWxJZDogcHJvcG9zYWwucHJvcG9zYWxJZH0pLnVwc2VydCgpLnVwZGF0ZU9uZSh7JHNldDpwcm9wb3NhbH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2FsSWRzLnB1c2gocHJvcG9zYWwucHJvcG9zYWxJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZS5yZXNwb25zZS5jb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBidWxrUHJvcG9zYWxzLmZpbmQoe3Byb3Bvc2FsSWQ6eyRuaW46cHJvcG9zYWxJZHN9fSkudXBkYXRlKHskc2V0OntcInZhbHVlLnByb3Bvc2FsX3N0YXR1c1wiOlwiUmVtb3ZlZFwifX0pO1xuICAgICAgICAgICAgICAgIGJ1bGtQcm9wb3NhbHMuZXhlY3V0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAncHJvcG9zYWxzLmdldFByb3Bvc2FsUmVzdWx0cyc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMudW5ibG9jaygpO1xuICAgICAgICBsZXQgcHJvcG9zYWxzID0gUHJvcG9zYWxzLmZpbmQoe1wicHJvcG9zYWxfc3RhdHVzXCI6eyRpbjpbXCJQYXNzZWRcIiwgXCJSZWplY3RlZFwiLCBcIlJlbW92ZWRcIixcIlZvdGluZ1BlcmlvZFwiXX19KS5mZXRjaCgpO1xuXG4gICAgICAgIGlmIChwcm9wb3NhbHMgJiYgKHByb3Bvc2Fscy5sZW5ndGggPiAwKSl7XG4gICAgICAgICAgICBmb3IgKGxldCBpIGluIHByb3Bvc2Fscyl7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlSW50KHByb3Bvc2Fsc1tpXS5wcm9wb3NhbElkKSA+IDApe1xuICAgICAgICAgICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBnZXQgcHJvcG9zYWwgZGVwb3NpdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB1cmwgPSBMQ0QgKyAnL2dvdi9wcm9wb3NhbHMvJytwcm9wb3NhbHNbaV0ucHJvcG9zYWxJZCsnL2RlcG9zaXRzJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXNwb25zZSA9IEhUVFAuZ2V0KHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvcG9zYWwgPSB7cHJvcG9zYWxJZDogcHJvcG9zYWxzW2ldLnByb3Bvc2FsSWR9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgPT0gMjAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGVwb3NpdHMgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2FsLmRlcG9zaXRzID0gZGVwb3NpdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IExDRCArICcvZ292L3Byb3Bvc2Fscy8nK3Byb3Bvc2Fsc1tpXS5wcm9wb3NhbElkKycvdm90ZXMnO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgPT0gMjAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdm90ZXMgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2FsLnZvdGVzID0gZ2V0Vm90ZURldGFpbCh2b3Rlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IExDRCArICcvZ292L3Byb3Bvc2Fscy8nK3Byb3Bvc2Fsc1tpXS5wcm9wb3NhbElkKycvdGFsbHknO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBIVFRQLmdldCh1cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgPT0gMjAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGFsbHkgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2FsLnRhbGx5ID0gdGFsbHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2FsLnVwZGF0ZWRBdCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBQcm9wb3NhbHMudXBkYXRlKHtwcm9wb3NhbElkOiBwcm9wb3NhbHNbaV0ucHJvcG9zYWxJZH0sIHskc2V0OnByb3Bvc2FsfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2goZSl7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0pXG5cbmNvbnN0IGdldFZvdGVEZXRhaWwgPSAodm90ZXMpID0+IHtcbiAgICBpZiAoIXZvdGVzKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBsZXQgdm90ZXJzID0gdm90ZXMubWFwKCh2b3RlKSA9PiB2b3RlLnZvdGVyKTtcbiAgICBsZXQgdm90aW5nUG93ZXJNYXAgPSB7fTtcbiAgICBsZXQgdmFsaWRhdG9yQWRkcmVzc01hcCA9IHt9O1xuICAgIFZhbGlkYXRvcnMuZmluZCh7ZGVsZWdhdG9yX2FkZHJlc3M6IHskaW46IHZvdGVyc319KS5mb3JFYWNoKCh2YWxpZGF0b3IpID0+IHtcbiAgICAgICAgdm90aW5nUG93ZXJNYXBbdmFsaWRhdG9yLmRlbGVnYXRvcl9hZGRyZXNzXSA9IHtcbiAgICAgICAgICAgIG1vbmlrZXI6IHZhbGlkYXRvci5kZXNjcmlwdGlvbi5tb25pa2VyLFxuICAgICAgICAgICAgYWRkcmVzczogdmFsaWRhdG9yLmFkZHJlc3MsXG4gICAgICAgICAgICB0b2tlbnM6IHBhcnNlRmxvYXQodmFsaWRhdG9yLnRva2VucyksXG4gICAgICAgICAgICBkZWxlZ2F0b3JTaGFyZXM6IHBhcnNlRmxvYXQodmFsaWRhdG9yLmRlbGVnYXRvcl9zaGFyZXMpLFxuICAgICAgICAgICAgZGVkdWN0ZWRTaGFyZXM6IHBhcnNlRmxvYXQodmFsaWRhdG9yLmRlbGVnYXRvcl9zaGFyZXMpXG4gICAgICAgIH1cbiAgICAgICAgdmFsaWRhdG9yQWRkcmVzc01hcFt2YWxpZGF0b3Iub3BlcmF0b3JfYWRkcmVzc10gPSB2YWxpZGF0b3IuZGVsZWdhdG9yX2FkZHJlc3M7XG4gICAgfSk7XG4gICAgdm90ZXJzLmZvckVhY2goKHZvdGVyKSA9PiB7XG4gICAgICAgIGlmICghdm90aW5nUG93ZXJNYXBbdm90ZXJdKSB7XG4gICAgICAgICAgICAvLyB2b3RlciBpcyBub3QgYSB2YWxpZGF0b3JcbiAgICAgICAgICAgIGxldCB1cmwgPSBgJHtMQ0R9L3N0YWtpbmcvZGVsZWdhdG9ycy8ke3ZvdGVyfS9kZWxlZ2F0aW9uc2A7XG4gICAgICAgICAgICBsZXQgZGVsZWdhdGlvbnM7XG4gICAgICAgICAgICBsZXQgdm90aW5nUG93ZXIgPSAwO1xuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgIGxldCByZXNwb25zZSA9IEhUVFAuZ2V0KHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgPT0gMjAwKXtcbiAgICAgICAgICAgICAgICAgICAgZGVsZWdhdGlvbnMgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGVsZWdhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGVnYXRpb25zLmZvckVhY2goKGRlbGVnYXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2hhcmVzID0gcGFyc2VGbG9hdChkZWxlZ2F0aW9uLnNoYXJlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbGlkYXRvckFkZHJlc3NNYXBbZGVsZWdhdGlvbi52YWxpZGF0b3JfYWRkcmVzc10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGVkdWN0IGRlbGVnYXRlZCBzaGFyZWRzIGZyb20gdmFsaWRhdG9yIGlmIGEgZGVsZWdhdG9yIHZvdGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWxpZGF0b3IgPSB2b3RpbmdQb3dlck1hcFt2YWxpZGF0b3JBZGRyZXNzTWFwW2RlbGVnYXRpb24udmFsaWRhdG9yX2FkZHJlc3NdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yLmRlZHVjdGVkU2hhcmVzIC09IHNoYXJlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbGlkYXRvci5kZWxlZ2F0b3Jfc2hhcmVzICE9IDApeyAvLyBhdm9pZGluZyBkaXZpc2lvbiBieSB6ZXJvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b3RpbmdQb3dlciArPSAoc2hhcmVzL3ZhbGlkYXRvci5kZWxlZ2F0b3JTaGFyZXMpICogdmFsaWRhdG9yLnRva2VucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbGlkYXRvciA9IFZhbGlkYXRvcnMuZmluZE9uZSh7b3BlcmF0b3JfYWRkcmVzczogZGVsZWdhdGlvbi52YWxpZGF0b3JfYWRkcmVzc30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsaWRhdG9yICYmIHZhbGlkYXRvci5kZWxlZ2F0b3Jfc2hhcmVzICE9IDApeyAvLyBhdm9pZGluZyBkaXZpc2lvbiBieSB6ZXJvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b3RpbmdQb3dlciArPSAoc2hhcmVzL3BhcnNlRmxvYXQodmFsaWRhdG9yLmRlbGVnYXRvcl9zaGFyZXMpKSAqIHBhcnNlRmxvYXQodmFsaWRhdG9yLnRva2Vucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZvdGluZ1Bvd2VyTWFwW3ZvdGVyXSA9IHt2b3RpbmdQb3dlcjogdm90aW5nUG93ZXJ9O1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHZvdGVzLm1hcCgodm90ZSkgPT4ge1xuICAgICAgICBsZXQgdm90ZXIgPSB2b3RpbmdQb3dlck1hcFt2b3RlLnZvdGVyXTtcbiAgICAgICAgbGV0IHZvdGluZ1Bvd2VyID0gdm90ZXIudm90aW5nUG93ZXI7XG4gICAgICAgIGlmICh2b3RpbmdQb3dlciA9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIHZvdGVyIGlzIGEgdmFsaWRhdG9yXG4gICAgICAgICAgICB2b3RpbmdQb3dlciA9IHZvdGVyLmRlbGVnYXRvclNoYXJlcz8oKHZvdGVyLmRlZHVjdGVkU2hhcmVzL3ZvdGVyLmRlbGVnYXRvclNoYXJlcykgKiB2b3Rlci50b2tlbnMpOjA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsuLi52b3RlLCB2b3RpbmdQb3dlcn07XG4gICAgfSk7XG59IiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBQcm9wb3NhbHMgfSBmcm9tICcuLi9wcm9wb3NhbHMuanMnO1xuaW1wb3J0IHsgY2hlY2sgfSBmcm9tICdtZXRlb3IvY2hlY2snXG5cbk1ldGVvci5wdWJsaXNoKCdwcm9wb3NhbHMubGlzdCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gUHJvcG9zYWxzLmZpbmQoe30sIHtzb3J0Ontwcm9wb3NhbElkOi0xfX0pO1xufSk7XG5cbk1ldGVvci5wdWJsaXNoKCdwcm9wb3NhbHMub25lJywgZnVuY3Rpb24gKGlkKXtcbiAgICBjaGVjayhpZCwgTnVtYmVyKTtcbiAgICByZXR1cm4gUHJvcG9zYWxzLmZpbmQoe3Byb3Bvc2FsSWQ6aWR9KTtcbn0pIiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuXG5leHBvcnQgY29uc3QgUHJvcG9zYWxzID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ3Byb3Bvc2FscycpO1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBWYWxpZGF0b3JSZWNvcmRzLCBBbmFseXRpY3MsIEF2ZXJhZ2VEYXRhLCBBdmVyYWdlVmFsaWRhdG9yRGF0YSB9IGZyb20gJy4uL3JlY29yZHMuanMnO1xuaW1wb3J0IHsgVmFsaWRhdG9ycyB9IGZyb20gJy4uLy4uL3ZhbGlkYXRvcnMvdmFsaWRhdG9ycy5qcyc7XG5pbXBvcnQgeyBTdGF0dXMgfSBmcm9tICcuLi8uLi9zdGF0dXMvc3RhdHVzLmpzJztcbmltcG9ydCB7IE1pc3NlZEJsb2Nrc1N0YXRzIH0gZnJvbSAnLi4vcmVjb3Jkcy5qcyc7XG5pbXBvcnQgeyBCbG9ja3Njb24gfSBmcm9tICcuLi8uLi9ibG9ja3MvYmxvY2tzLmpzJztcbmltcG9ydCB7IENoYWluIH0gZnJvbSAnLi4vLi4vY2hhaW4vY2hhaW4uanMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG4gICAgJ1ZhbGlkYXRvclJlY29yZHMubWlzc2VkQmxvY2tzQ291bnQnOiBmdW5jdGlvbihhZGRyZXNzKXtcbiAgICAgICAgdGhpcy51bmJsb2NrKCk7XG4gICAgICAgIHJldHVybiBWYWxpZGF0b3JSZWNvcmRzLmZpbmQoe2FkZHJlc3M6YWRkcmVzc30pLmNvdW50KCk7XG4gICAgfSxcbiAgICAnVmFsaWRhdG9yUmVjb3Jkcy5jYWxjdWxhdGVNaXNzZWRCbG9ja3MnOiBmdW5jdGlvbigpe1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlZhbGlkYXRvclJlY29yZHMuY2FsY3VsYXRlTWlzc2VkQmxvY2tzOiBcIitDT1VOVE1JU1NFREJMT0NLUyk7XG4gICAgICAgIGlmICghQ09VTlRNSVNTRURCTE9DS1Mpe1xuICAgICAgICAgICAgQ09VTlRNSVNTRURCTE9DS1MgPSB0cnVlO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NhbHVsYXRlIG1pc3NlZCBibG9ja3MgY291bnQnKTtcbiAgICAgICAgICAgIHRoaXMudW5ibG9jaygpO1xuICAgICAgICAgICAgbGV0IHZhbGlkYXRvcnMgPSBWYWxpZGF0b3JzLmZpbmQoe30pLmZldGNoKCk7XG4gICAgICAgICAgICBsZXQgbGF0ZXN0SGVpZ2h0ID0gTWV0ZW9yLmNhbGwoJ2Jsb2Nrcy5nZXRDdXJyZW50SGVpZ2h0Jyk7XG4gICAgICAgICAgICBsZXQgZXhwbG9yZXJTdGF0dXMgPSBTdGF0dXMuZmluZE9uZSh7Y2hhaW5JZDogTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5jaGFpbklkfSk7XG4gICAgICAgICAgICBsZXQgc3RhcnRIZWlnaHQgPSAoZXhwbG9yZXJTdGF0dXMmJmV4cGxvcmVyU3RhdHVzLmxhc3RNaXNzZWRCbG9ja0hlaWdodCk/ZXhwbG9yZXJTdGF0dXMubGFzdE1pc3NlZEJsb2NrSGVpZ2h0Ok1ldGVvci5zZXR0aW5ncy5wYXJhbXMuc3RhcnRIZWlnaHQ7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhsYXRlc3RIZWlnaHQpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coc3RhcnRIZWlnaHQpO1xuICAgICAgICAgICAgY29uc3QgYnVsa01pc3NlZFN0YXRzID0gTWlzc2VkQmxvY2tzU3RhdHMucmF3Q29sbGVjdGlvbigpLmluaXRpYWxpemVVbm9yZGVyZWRCdWxrT3AoKTtcbiAgICAgICAgICAgIGZvciAoaSBpbiB2YWxpZGF0b3JzKXtcbiAgICAgICAgICAgICAgICAvLyBpZiAoKHZhbGlkYXRvcnNbaV0uYWRkcmVzcyA9PSBcIkI4NTUyRUFDMEQxMjNBNkJGNjA5MTIzMDQ3QTUxODFENDVFRTkwQjVcIikgfHwgKHZhbGlkYXRvcnNbaV0uYWRkcmVzcyA9PSBcIjY5RDk5QjJDNjYwNDNBQ0JFQUE4NDQ3NTI1QzM1NkFGQzY0MDhFMENcIikgfHwgKHZhbGlkYXRvcnNbaV0uYWRkcmVzcyA9PSBcIjM1QUQ3QTJDRDJGQzcxNzExQTY3NTgzMEVDMTE1ODA4MjI3M0Q0NTdcIikpe1xuICAgICAgICAgICAgICAgIGxldCB2b3RlckFkZHJlc3MgPSB2YWxpZGF0b3JzW2ldLmFkZHJlc3M7XG4gICAgICAgICAgICAgICAgbGV0IG1pc3NlZFJlY29yZHMgPSBWYWxpZGF0b3JSZWNvcmRzLmZpbmQoe1xuICAgICAgICAgICAgICAgICAgICBhZGRyZXNzOnZvdGVyQWRkcmVzcywgXG4gICAgICAgICAgICAgICAgICAgIGV4aXN0czpmYWxzZSwgXG4gICAgICAgICAgICAgICAgICAgICRhbmQ6IFsgeyBoZWlnaHQ6IHsgJGd0OiBzdGFydEhlaWdodCB9IH0sIHsgaGVpZ2h0OiB7ICRsdGU6IGxhdGVzdEhlaWdodCB9IH0gXSBcbiAgICAgICAgICAgICAgICB9KS5mZXRjaCgpO1xuXG4gICAgICAgICAgICAgICAgbGV0IGNvdW50cyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJtaXNzZWRSZWNvcmRzIHRvIHByb2Nlc3M6IFwiK21pc3NlZFJlY29yZHMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBmb3IgKGIgaW4gbWlzc2VkUmVjb3Jkcyl7XG4gICAgICAgICAgICAgICAgICAgIGxldCBibG9jayA9IEJsb2Nrc2Nvbi5maW5kT25lKHtoZWlnaHQ6bWlzc2VkUmVjb3Jkc1tiXS5oZWlnaHR9KTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGV4aXN0aW5nUmVjb3JkID0gTWlzc2VkQmxvY2tzU3RhdHMuZmluZE9uZSh7dm90ZXI6dm90ZXJBZGRyZXNzLCBwcm9wb3NlcjpibG9jay5wcm9wb3NlckFkZHJlc3N9KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvdW50c1tibG9jay5wcm9wb3NlckFkZHJlc3NdID09PSAndW5kZWZpbmVkJyl7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhpc3RpbmdSZWNvcmQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50c1tibG9jay5wcm9wb3NlckFkZHJlc3NdID0gZXhpc3RpbmdSZWNvcmQuY291bnQrMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnRzW2Jsb2NrLnByb3Bvc2VyQWRkcmVzc10gPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudHNbYmxvY2sucHJvcG9zZXJBZGRyZXNzXSsrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChhZGRyZXNzIGluIGNvdW50cyl7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdm90ZXI6IHZvdGVyQWRkcmVzcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3Bvc2VyOmFkZHJlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogY291bnRzW2FkZHJlc3NdXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBidWxrTWlzc2VkU3RhdHMuZmluZCh7dm90ZXI6dm90ZXJBZGRyZXNzLCBwcm9wb3NlcjphZGRyZXNzfSkudXBzZXJ0KCkudXBkYXRlT25lKHskc2V0OmRhdGF9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChidWxrTWlzc2VkU3RhdHMubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICAgICAgYnVsa01pc3NlZFN0YXRzLmV4ZWN1dGUoTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycil7XG4gICAgICAgICAgICAgICAgICAgICAgICBDT1VOVE1JU1NFREJMT0NLUyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIFN0YXR1cy51cHNlcnQoe2NoYWluSWQ6IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuY2hhaW5JZH0sIHskc2V0OntsYXN0TWlzc2VkQmxvY2tIZWlnaHQ6bGF0ZXN0SGVpZ2h0LCBsYXN0TWlzc2VkQmxvY2tUaW1lOiBuZXcgRGF0ZSgpfX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgQ09VTlRNSVNTRURCTE9DS1MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZG9uZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgQ09VTlRNSVNTRURCTE9DS1MgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIHJldHVybiBcInVwZGF0aW5nLi4uXCI7XG4gICAgICAgIH1cbiAgICB9LFxuICAgICdBbmFseXRpY3MuYWdncmVnYXRlQmxvY2tUaW1lQW5kVm90aW5nUG93ZXInOiBmdW5jdGlvbih0aW1lKXtcbiAgICAgICAgdGhpcy51bmJsb2NrKCk7XG4gICAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRpbWUgPT0gJ20nKXtcbiAgICAgICAgICAgIGxldCBhdmVyYWdlQmxvY2tUaW1lID0gMDtcbiAgICAgICAgICAgIGxldCBhdmVyYWdlVm90aW5nUG93ZXIgPSAwO1xuICAgIFxuICAgICAgICAgICAgbGV0IGFuYWx5dGljcyA9IEFuYWx5dGljcy5maW5kKHsgXCJ0aW1lXCI6IHsgJGd0OiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gNjAgKiAxMDAwKSB9IH0pLmZldGNoKCk7XG4gICAgICAgICAgICBpZiAoYW5hbHl0aWNzLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgICAgIGZvciAoaSBpbiBhbmFseXRpY3Mpe1xuICAgICAgICAgICAgICAgICAgICBhdmVyYWdlQmxvY2tUaW1lICs9IGFuYWx5dGljc1tpXS50aW1lRGlmZjtcbiAgICAgICAgICAgICAgICAgICAgYXZlcmFnZVZvdGluZ1Bvd2VyICs9IGFuYWx5dGljc1tpXS52b3RpbmdfcG93ZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGF2ZXJhZ2VCbG9ja1RpbWUgPSBhdmVyYWdlQmxvY2tUaW1lIC8gYW5hbHl0aWNzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBhdmVyYWdlVm90aW5nUG93ZXIgPSBhdmVyYWdlVm90aW5nUG93ZXIgLyBhbmFseXRpY3MubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgQ2hhaW4udXBkYXRlKHtjaGFpbklkOk1ldGVvci5zZXR0aW5ncy5wdWJsaWMuY2hhaW5JZH0seyRzZXQ6e2xhc3RNaW51dGVWb3RpbmdQb3dlcjphdmVyYWdlVm90aW5nUG93ZXIsIGxhc3RNaW51dGVCbG9ja1RpbWU6YXZlcmFnZUJsb2NrVGltZX19KTtcbiAgICAgICAgICAgICAgICBBdmVyYWdlRGF0YS5pbnNlcnQoe1xuICAgICAgICAgICAgICAgICAgICBhdmVyYWdlQmxvY2tUaW1lOiBhdmVyYWdlQmxvY2tUaW1lLFxuICAgICAgICAgICAgICAgICAgICBhdmVyYWdlVm90aW5nUG93ZXI6IGF2ZXJhZ2VWb3RpbmdQb3dlcixcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogdGltZSxcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBub3dcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aW1lID09ICdoJyl7XG4gICAgICAgICAgICBsZXQgYXZlcmFnZUJsb2NrVGltZSA9IDA7XG4gICAgICAgICAgICBsZXQgYXZlcmFnZVZvdGluZ1Bvd2VyID0gMDtcbiAgICAgICAgICAgIGxldCBhbmFseXRpY3MgPSBBbmFseXRpY3MuZmluZCh7IFwidGltZVwiOiB7ICRndDogbmV3IERhdGUoRGF0ZS5ub3coKSAtIDYwKjYwICogMTAwMCkgfSB9KS5mZXRjaCgpO1xuICAgICAgICAgICAgaWYgKGFuYWx5dGljcy5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICBmb3IgKGkgaW4gYW5hbHl0aWNzKXtcbiAgICAgICAgICAgICAgICAgICAgYXZlcmFnZUJsb2NrVGltZSArPSBhbmFseXRpY3NbaV0udGltZURpZmY7XG4gICAgICAgICAgICAgICAgICAgIGF2ZXJhZ2VWb3RpbmdQb3dlciArPSBhbmFseXRpY3NbaV0udm90aW5nX3Bvd2VyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhdmVyYWdlQmxvY2tUaW1lID0gYXZlcmFnZUJsb2NrVGltZSAvIGFuYWx5dGljcy5sZW5ndGg7ICAgIFxuICAgICAgICAgICAgICAgIGF2ZXJhZ2VWb3RpbmdQb3dlciA9IGF2ZXJhZ2VWb3RpbmdQb3dlciAvIGFuYWx5dGljcy5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBDaGFpbi51cGRhdGUoe2NoYWluSWQ6TWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5jaGFpbklkfSx7JHNldDp7bGFzdEhvdXJWb3RpbmdQb3dlcjphdmVyYWdlVm90aW5nUG93ZXIsIGxhc3RIb3VyQmxvY2tUaW1lOmF2ZXJhZ2VCbG9ja1RpbWV9fSk7XG4gICAgICAgICAgICAgICAgQXZlcmFnZURhdGEuaW5zZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgYXZlcmFnZUJsb2NrVGltZTogYXZlcmFnZUJsb2NrVGltZSxcbiAgICAgICAgICAgICAgICAgICAgYXZlcmFnZVZvdGluZ1Bvd2VyOiBhdmVyYWdlVm90aW5nUG93ZXIsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHRpbWUsXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogbm93XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aW1lID09ICdkJyl7XG4gICAgICAgICAgICBsZXQgYXZlcmFnZUJsb2NrVGltZSA9IDA7XG4gICAgICAgICAgICBsZXQgYXZlcmFnZVZvdGluZ1Bvd2VyID0gMDtcbiAgICAgICAgICAgIGxldCBhbmFseXRpY3MgPSBBbmFseXRpY3MuZmluZCh7IFwidGltZVwiOiB7ICRndDogbmV3IERhdGUoRGF0ZS5ub3coKSAtIDI0KjYwKjYwICogMTAwMCkgfSB9KS5mZXRjaCgpO1xuICAgICAgICAgICAgaWYgKGFuYWx5dGljcy5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICBmb3IgKGkgaW4gYW5hbHl0aWNzKXtcbiAgICAgICAgICAgICAgICAgICAgYXZlcmFnZUJsb2NrVGltZSArPSBhbmFseXRpY3NbaV0udGltZURpZmY7XG4gICAgICAgICAgICAgICAgICAgIGF2ZXJhZ2VWb3RpbmdQb3dlciArPSBhbmFseXRpY3NbaV0udm90aW5nX3Bvd2VyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhdmVyYWdlQmxvY2tUaW1lID0gYXZlcmFnZUJsb2NrVGltZSAvIGFuYWx5dGljcy5sZW5ndGg7ICAgIFxuICAgICAgICAgICAgICAgIGF2ZXJhZ2VWb3RpbmdQb3dlciA9IGF2ZXJhZ2VWb3RpbmdQb3dlciAvIGFuYWx5dGljcy5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBDaGFpbi51cGRhdGUoe2NoYWluSWQ6TWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5jaGFpbklkfSx7JHNldDp7bGFzdERheVZvdGluZ1Bvd2VyOmF2ZXJhZ2VWb3RpbmdQb3dlciwgbGFzdERheUJsb2NrVGltZTphdmVyYWdlQmxvY2tUaW1lfX0pO1xuICAgICAgICAgICAgICAgIEF2ZXJhZ2VEYXRhLmluc2VydCh7XG4gICAgICAgICAgICAgICAgICAgIGF2ZXJhZ2VCbG9ja1RpbWU6IGF2ZXJhZ2VCbG9ja1RpbWUsXG4gICAgICAgICAgICAgICAgICAgIGF2ZXJhZ2VWb3RpbmdQb3dlcjogYXZlcmFnZVZvdGluZ1Bvd2VyLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiB0aW1lLFxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQXQ6IG5vd1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXR1cm4gYW5hbHl0aWNzLmxlbmd0aDtcbiAgICB9LFxuICAgICdBbmFseXRpY3MuYWdncmVnYXRlVmFsaWRhdG9yRGFpbHlCbG9ja1RpbWUnOiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLnVuYmxvY2soKTtcbiAgICAgICAgbGV0IHZhbGlkYXRvcnMgPSBWYWxpZGF0b3JzLmZpbmQoe30pLmZldGNoKCk7XG4gICAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBmb3IgKGkgaW4gdmFsaWRhdG9ycyl7XG4gICAgICAgICAgICBsZXQgYXZlcmFnZUJsb2NrVGltZSA9IDA7XG5cbiAgICAgICAgICAgIGxldCBibG9ja3MgPSBCbG9ja3Njb24uZmluZCh7cHJvcG9zZXJBZGRyZXNzOnZhbGlkYXRvcnNbaV0uYWRkcmVzcywgXCJ0aW1lXCI6IHsgJGd0OiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gMjQqNjAqNjAgKiAxMDAwKSB9fSwge2ZpZWxkczp7aGVpZ2h0OjF9fSkuZmV0Y2goKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGJsb2Nrcyk7XG5cbiAgICAgICAgICAgIGlmIChibG9ja3MubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICAgICAgbGV0IGJsb2NrSGVpZ2h0cyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoYiBpbiBibG9ja3Mpe1xuICAgICAgICAgICAgICAgICAgICBibG9ja0hlaWdodHMucHVzaChibG9ja3NbYl0uaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYmxvY2tIZWlnaHRzKTtcbiAgICAgICAgICAgICAgICBsZXQgYW5hbHl0aWNzID0gQW5hbHl0aWNzLmZpbmQoe2hlaWdodDogeyRpbjpibG9ja0hlaWdodHN9fSwge2ZpZWxkczp7aGVpZ2h0OjEsdGltZURpZmY6MX19KS5mZXRjaCgpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGFuYWx5dGljcyk7XG4gICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZm9yIChhIGluIGFuYWx5dGljcyl7XG4gICAgICAgICAgICAgICAgICAgIGF2ZXJhZ2VCbG9ja1RpbWUgKz0gYW5hbHl0aWNzW2FdLnRpbWVEaWZmO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGF2ZXJhZ2VCbG9ja1RpbWUgPSBhdmVyYWdlQmxvY2tUaW1lIC8gYW5hbHl0aWNzLmxlbmd0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgQXZlcmFnZVZhbGlkYXRvckRhdGEuaW5zZXJ0KHtcbiAgICAgICAgICAgICAgICBwcm9wb3NlckFkZHJlc3M6IHZhbGlkYXRvcnNbaV0uYWRkcmVzcyxcbiAgICAgICAgICAgICAgICBhdmVyYWdlQmxvY2tUaW1lOiBhdmVyYWdlQmxvY2tUaW1lLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdWYWxpZGF0b3JEYWlseUF2ZXJhZ2VCbG9ja1RpbWUnLFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogbm93XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufSlcbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgVmFsaWRhdG9yUmVjb3JkcywgQW5hbHl0aWNzLCBNaXNzZWRCbG9ja3NTdGF0cywgVlBEaXN0cmlidXRpb25zIH0gZnJvbSAnLi4vcmVjb3Jkcy5qcyc7XG5pbXBvcnQgeyBWYWxpZGF0b3JzIH0gZnJvbSAnLi4vLi4vdmFsaWRhdG9ycy92YWxpZGF0b3JzLmpzJztcblxuTWV0ZW9yLnB1Ymxpc2goJ3ZhbGlkYXRvcl9yZWNvcmRzLmFsbCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gVmFsaWRhdG9yUmVjb3Jkcy5maW5kKCk7XG59KTtcblxuTWV0ZW9yLnB1Ymxpc2goJ3ZhbGlkYXRvcl9yZWNvcmRzLnVwdGltZScsIGZ1bmN0aW9uKGFkZHJlc3MsIG51bSl7XG4gICAgcmV0dXJuIFZhbGlkYXRvclJlY29yZHMuZmluZCh7YWRkcmVzczphZGRyZXNzfSx7bGltaXQ6bnVtLCBzb3J0OntoZWlnaHQ6LTF9fSk7XG59KTtcblxuTWV0ZW9yLnB1Ymxpc2goJ2FuYWx5dGljcy5oaXN0b3J5JywgZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gQW5hbHl0aWNzLmZpbmQoe30se3NvcnQ6e2hlaWdodDotMX0sbGltaXQ6NTB9KTtcbn0pO1xuXG5NZXRlb3IucHVibGlzaCgndnBEaXN0cmlidXRpb24ubGF0ZXN0JywgZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gVlBEaXN0cmlidXRpb25zLmZpbmQoe30se3NvcnQ6e2hlaWdodDotMX0sIGxpbWl0OjF9KTtcbn0pO1xuXG5wdWJsaXNoQ29tcG9zaXRlKCdtaXNzZWRibG9ja3MudmFsaWRhdG9yJywgZnVuY3Rpb24oYWRkcmVzcywgdHlwZSl7XG4gICAgbGV0IGNvbmRpdGlvbnMgPSB7fTtcbiAgICBpZiAodHlwZSA9PSAndm90ZXInKXtcbiAgICAgICAgY29uZGl0aW9ucyA9IHtcbiAgICAgICAgICAgIHZvdGVyOiBhZGRyZXNzXG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZXtcbiAgICAgICAgY29uZGl0aW9ucyA9IHtcbiAgICAgICAgICAgIHByb3Bvc2VyOiBhZGRyZXNzXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmluZCgpe1xuICAgICAgICAgICAgcmV0dXJuIE1pc3NlZEJsb2Nrc1N0YXRzLmZpbmQoY29uZGl0aW9ucylcbiAgICAgICAgfSxcbiAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaW5kKHN0YXRzKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFZhbGlkYXRvcnMuZmluZChcbiAgICAgICAgICAgICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAge2ZpZWxkczp7YWRkcmVzczoxLCBkZXNjcmlwdGlvbjoxfX1cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH1cbn0pO1xuIiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IHsgVmFsaWRhdG9ycyB9IGZyb20gJy4uL3ZhbGlkYXRvcnMvdmFsaWRhdG9ycyc7XG5cbmV4cG9ydCBjb25zdCBWYWxpZGF0b3JSZWNvcmRzID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ3ZhbGlkYXRvcl9yZWNvcmRzJyk7XG5leHBvcnQgY29uc3QgQW5hbHl0aWNzID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ2FuYWx5dGljcycpO1xuZXhwb3J0IGNvbnN0IE1pc3NlZEJsb2Nrc1N0YXRzID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ21pc3NlZF9ibG9ja3Nfc3RhdHMnKTtcbmV4cG9ydCBjb25zdCBWUERpc3RyaWJ1dGlvbnMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbigndm90aW5nX3Bvd2VyX2Rpc3RyaWJ1dGlvbnMnKTtcbmV4cG9ydCBjb25zdCBBdmVyYWdlRGF0YSA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCdhdmVyYWdlX2RhdGEnKTtcbmV4cG9ydCBjb25zdCBBdmVyYWdlVmFsaWRhdG9yRGF0YSA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCdhdmVyYWdlX3ZhbGlkYXRvcl9kYXRhJyk7XG5cbk1pc3NlZEJsb2Nrc1N0YXRzLmhlbHBlcnMoe1xuICAgIHByb3Bvc2VyTW9uaWtlcigpe1xuICAgICAgICBsZXQgdmFsaWRhdG9yID0gVmFsaWRhdG9ycy5maW5kT25lKHthZGRyZXNzOnRoaXMucHJvcG9zZXJ9KTtcbiAgICAgICAgcmV0dXJuICh2YWxpZGF0b3IuZGVzY3JpcHRpb24pP3ZhbGlkYXRvci5kZXNjcmlwdGlvbi5tb25pa2VyOnRoaXMucHJvcG9zZXI7XG4gICAgfSxcbiAgICB2b3Rlck1vbmlrZXIoKXtcbiAgICAgICAgbGV0IHZhbGlkYXRvciA9IFZhbGlkYXRvcnMuZmluZE9uZSh7YWRkcmVzczp0aGlzLnZvdGVyfSk7XG4gICAgICAgIHJldHVybiAodmFsaWRhdG9yLmRlc2NyaXB0aW9uKT92YWxpZGF0b3IuZGVzY3JpcHRpb24ubW9uaWtlcjp0aGlzLnZvdGVyO1xuICAgIH1cbn0pXG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFN0YXR1cyB9IGZyb20gJy4uL3N0YXR1cy5qcyc7XG5pbXBvcnQgeyBjaGVjayB9IGZyb20gJ21ldGVvci9jaGVjaydcblxuTWV0ZW9yLnB1Ymxpc2goJ3N0YXR1cy5zdGF0dXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFN0YXR1cy5maW5kKHtjaGFpbklkOk1ldGVvci5zZXR0aW5ncy5wdWJsaWMuY2hhaW5JZH0pO1xufSk7XG5cbiIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcblxuZXhwb3J0IGNvbnN0IFN0YXR1cyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCdzdGF0dXMnKTsiLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEhUVFAgfSBmcm9tICdtZXRlb3IvaHR0cCc7XG5pbXBvcnQgeyBUcmFuc2FjdGlvbnMgfSBmcm9tICcuLi8uLi90cmFuc2FjdGlvbnMvdHJhbnNhY3Rpb25zLmpzJztcbmltcG9ydCB7IFZhbGlkYXRvcnMgfSBmcm9tICcuLi8uLi92YWxpZGF0b3JzL3ZhbGlkYXRvcnMuanMnO1xuaW1wb3J0IHsgVm90aW5nUG93ZXJIaXN0b3J5IH0gZnJvbSAnLi4vLi4vdm90aW5nLXBvd2VyL2hpc3RvcnkuanMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG4gICAgJ1RyYW5zYWN0aW9ucy5pbmRleCc6IGZ1bmN0aW9uKGhhc2gsIGJsb2NrVGltZSl7XG4gICAgICAgIHRoaXMudW5ibG9jaygpO1xuICAgICAgICBoYXNoID0gaGFzaC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICBsZXQgdXJsID0gTENEKyAnL3R4cy8nK2hhc2g7XG4gICAgICAgIGxldCByZXNwb25zZSA9IEhUVFAuZ2V0KHVybCk7XG4gICAgICAgIGxldCB0eCA9IEpTT04ucGFyc2UocmVzcG9uc2UuY29udGVudCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coaGFzaCk7XG5cbiAgICAgICAgdHguaGVpZ2h0ID0gcGFyc2VJbnQodHguaGVpZ2h0KTtcblxuICAgICAgICBsZXQgdHhJZCA9IFRyYW5zYWN0aW9ucy5pbnNlcnQodHgpO1xuICAgICAgICBpZiAodHhJZCl7XG4gICAgICAgICAgICByZXR1cm4gdHhJZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcbiAgICB9LFxuICAgICdUcmFuc2FjdGlvbnMuZmluZERlbGVnYXRpb24nOiBmdW5jdGlvbihhZGRyZXNzLCBoZWlnaHQpe1xuICAgICAgICByZXR1cm4gVHJhbnNhY3Rpb25zLmZpbmQoe1xuICAgICAgICAgICAgJG9yOiBbeyRhbmQ6IFtcbiAgICAgICAgICAgICAgICB7XCJ0YWdzLmtleVwiOiBcImFjdGlvblwifSwgXG4gICAgICAgICAgICAgICAge1widGFncy52YWx1ZVwiOiBcImRlbGVnYXRlXCJ9LCBcbiAgICAgICAgICAgICAgICB7XCJ0YWdzLmtleVwiOiBcImRlc3RpbmF0aW9uLXZhbGlkYXRvclwifSwgXG4gICAgICAgICAgICAgICAge1widGFncy52YWx1ZVwiOiBhZGRyZXNzfVxuICAgICAgICAgICAgXX0sIHskYW5kOltcbiAgICAgICAgICAgICAgICB7XCJ0YWdzLmtleVwiOiBcImFjdGlvblwifSwgXG4gICAgICAgICAgICAgICAge1widGFncy52YWx1ZVwiOiBcInVuamFpbFwifSwgXG4gICAgICAgICAgICAgICAge1widGFncy5rZXlcIjogXCJ2YWxpZGF0b3JcIn0sIFxuICAgICAgICAgICAgICAgIHtcInRhZ3MudmFsdWVcIjogYWRkcmVzc31cbiAgICAgICAgICAgIF19LCB7JGFuZDpbXG4gICAgICAgICAgICAgICAge1widGFncy5rZXlcIjogXCJhY3Rpb25cIn0sIFxuICAgICAgICAgICAgICAgIHtcInRhZ3MudmFsdWVcIjogXCJjcmVhdGVfdmFsaWRhdG9yXCJ9LCBcbiAgICAgICAgICAgICAgICB7XCJ0YWdzLmtleVwiOiBcImRlc3RpbmF0aW9uLXZhbGlkYXRvclwifSwgXG4gICAgICAgICAgICAgICAge1widGFncy52YWx1ZVwiOiBhZGRyZXNzfVxuICAgICAgICAgICAgXX0sIHskYW5kOltcbiAgICAgICAgICAgICAgICB7XCJ0YWdzLmtleVwiOiBcImFjdGlvblwifSwgXG4gICAgICAgICAgICAgICAge1widGFncy52YWx1ZVwiOiBcImJlZ2luX3VuYm9uZGluZ1wifSwgXG4gICAgICAgICAgICAgICAge1widGFncy5rZXlcIjogXCJzb3VyY2UtdmFsaWRhdG9yXCJ9LCBcbiAgICAgICAgICAgICAgICB7XCJ0YWdzLnZhbHVlXCI6IGFkZHJlc3N9XG4gICAgICAgICAgICBdfSwgeyRhbmQ6W1xuICAgICAgICAgICAgICAgIHtcInRhZ3Mua2V5XCI6IFwiYWN0aW9uXCJ9LCBcbiAgICAgICAgICAgICAgICB7XCJ0YWdzLnZhbHVlXCI6IFwiYmVnaW5fcmVkZWxlZ2F0ZVwifSwgXG4gICAgICAgICAgICAgICAge1widGFncy5rZXlcIjogXCJkZXN0aW5hdGlvbi12YWxpZGF0b3JcIn0sIFxuICAgICAgICAgICAgICAgIHtcInRhZ3MudmFsdWVcIjogYWRkcmVzc31cbiAgICAgICAgICAgIF19XSwgXG4gICAgICAgICAgICBcImNvZGVcIjogeyRleGlzdHM6IGZhbHNlfSwgXG4gICAgICAgICAgICBoZWlnaHQ6eyRsdDpoZWlnaHR9fSxcbiAgICAgICAge3NvcnQ6e2hlaWdodDotMX0sXG4gICAgICAgICAgICBsaW1pdDogMX1cbiAgICAgICAgKS5mZXRjaCgpO1xuICAgIH0sXG4gICAgJ1RyYW5zYWN0aW9ucy5maW5kVXNlcic6IGZ1bmN0aW9uKGFkZHJlc3Mpe1xuICAgICAgICAvLyBhZGRyZXNzIGlzIGVpdGhlciBkZWxlZ2F0b3IgYWRkcmVzcyBvciB2YWxpZGF0b3Igb3BlcmF0b3IgYWRkcmVzc1xuICAgICAgICBsZXQgdmFsaWRhdG9yO1xuICAgICAgICBpZiAoYWRkcmVzcy5pbmNsdWRlcyhNZXRlb3Iuc2V0dGluZ3MucHVibGljLmJlY2gzMlByZWZpeFZhbEFkZHIpKXtcbiAgICAgICAgICAgIC8vIHZhbGlkYXRvciBvcGVyYXRvciBhZGRyZXNzXG4gICAgICAgICAgICB2YWxpZGF0b3IgPSBWYWxpZGF0b3JzLmZpbmRPbmUoe29wZXJhdG9yX2FkZHJlc3M6YWRkcmVzc30sIHtmaWVsZHM6e2FkZHJlc3M6MSwgZGVzY3JpcHRpb246MSwgb3BlcmF0b3JfYWRkcmVzczoxLCBkZWxlZ2F0b3JfYWRkcmVzczoxfX0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGFkZHJlc3MuaW5jbHVkZXMoTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5iZWNoMzJQcmVmaXhBY2NBZGRyKSl7XG4gICAgICAgICAgICAvLyBkZWxlZ2F0b3IgYWRkcmVzc1xuICAgICAgICAgICAgdmFsaWRhdG9yID0gVmFsaWRhdG9ycy5maW5kT25lKHtkZWxlZ2F0b3JfYWRkcmVzczphZGRyZXNzfSwge2ZpZWxkczp7YWRkcmVzczoxLCBkZXNjcmlwdGlvbjoxLCBvcGVyYXRvcl9hZGRyZXNzOjEsIGRlbGVnYXRvcl9hZGRyZXNzOjF9fSk7ICAgICAgICBcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWxpZGF0b3Ipe1xuICAgICAgICAgICAgcmV0dXJuIHZhbGlkYXRvcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICB9XG59KTsiLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFRyYW5zYWN0aW9ucyB9IGZyb20gJy4uL3RyYW5zYWN0aW9ucy5qcyc7XG5pbXBvcnQgeyBCbG9ja3Njb24gfSBmcm9tICcuLi8uLi9ibG9ja3MvYmxvY2tzLmpzJztcblxuXG5wdWJsaXNoQ29tcG9zaXRlKCd0cmFuc2FjdGlvbnMubGlzdCcsIGZ1bmN0aW9uKGxpbWl0ID0gMzApe1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbmQoKXtcbiAgICAgICAgICAgIHJldHVybiBUcmFuc2FjdGlvbnMuZmluZCh7fSx7c29ydDp7aGVpZ2h0Oi0xfSwgbGltaXQ6bGltaXR9KVxuICAgICAgICB9LFxuICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpbmQodHgpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQmxvY2tzY29uLmZpbmQoXG4gICAgICAgICAgICAgICAgICAgICAgICB7aGVpZ2h0OnR4LmhlaWdodH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZmllbGRzOnt0aW1lOjEsIGhlaWdodDoxfX1cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH1cbn0pO1xuXG5wdWJsaXNoQ29tcG9zaXRlKCd0cmFuc2FjdGlvbnMudmFsaWRhdG9yJywgZnVuY3Rpb24odmFsaWRhdG9yQWRkcmVzcywgZGVsZWdhdG9yQWRkcmVzcywgbGltaXQ9MTAwKXtcbiAgICBsZXQgcXVlcnkgPSB7fTtcbiAgICBpZiAodmFsaWRhdG9yQWRkcmVzcyAmJiBkZWxlZ2F0b3JBZGRyZXNzKXtcbiAgICAgICAgcXVlcnkgPSB7JG9yOlt7XCJ0YWdzLnZhbHVlXCI6dmFsaWRhdG9yQWRkcmVzc30sIHtcInRhZ3MudmFsdWVcIjpkZWxlZ2F0b3JBZGRyZXNzfV19XG4gICAgfVxuXG4gICAgaWYgKCF2YWxpZGF0b3JBZGRyZXNzICYmIGRlbGVnYXRvckFkZHJlc3Mpe1xuICAgICAgICBxdWVyeSA9IHtcInRhZ3MudmFsdWVcIjpkZWxlZ2F0b3JBZGRyZXNzfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGZpbmQoKXtcbiAgICAgICAgICAgIHJldHVybiBUcmFuc2FjdGlvbnMuZmluZChxdWVyeSwge3NvcnQ6e2hlaWdodDotMX0sIGxpbWl0OmxpbWl0fSlcbiAgICAgICAgfSxcbiAgICAgICAgY2hpbGRyZW46W1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpbmQodHgpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQmxvY2tzY29uLmZpbmQoXG4gICAgICAgICAgICAgICAgICAgICAgICB7aGVpZ2h0OnR4LmhlaWdodH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZmllbGRzOnt0aW1lOjEsIGhlaWdodDoxfX1cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH1cbn0pXG5cbnB1Ymxpc2hDb21wb3NpdGUoJ3RyYW5zYWN0aW9ucy5maW5kT25lJywgZnVuY3Rpb24oaGFzaCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmluZCgpe1xuICAgICAgICAgICAgcmV0dXJuIFRyYW5zYWN0aW9ucy5maW5kKHt0eGhhc2g6aGFzaH0pXG4gICAgICAgIH0sXG4gICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmluZCh0eCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBCbG9ja3Njb24uZmluZChcbiAgICAgICAgICAgICAgICAgICAgICAgIHtoZWlnaHQ6dHguaGVpZ2h0fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmaWVsZHM6e3RpbWU6MSwgaGVpZ2h0OjF9fVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdICAgICAgICBcbiAgICB9XG59KVxuXG5wdWJsaXNoQ29tcG9zaXRlKCd0cmFuc2FjdGlvbnMuaGVpZ2h0JywgZnVuY3Rpb24oaGVpZ2h0KXtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaW5kKCl7XG4gICAgICAgICAgICByZXR1cm4gVHJhbnNhY3Rpb25zLmZpbmQoe2hlaWdodDpoZWlnaHR9KVxuICAgICAgICB9LFxuICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpbmQodHgpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQmxvY2tzY29uLmZpbmQoXG4gICAgICAgICAgICAgICAgICAgICAgICB7aGVpZ2h0OnR4LmhlaWdodH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZmllbGRzOnt0aW1lOjEsIGhlaWdodDoxfX1cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXSAgICAgICAgXG4gICAgfVxufSkiLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBCbG9ja3Njb24gfSBmcm9tICcuLi9ibG9ja3MvYmxvY2tzLmpzJztcbmltcG9ydCB7IFR4SWNvbiB9IGZyb20gJy4uLy4uL3VpL2NvbXBvbmVudHMvSWNvbnMuanN4JztcblxuZXhwb3J0IGNvbnN0IFRyYW5zYWN0aW9ucyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCd0cmFuc2FjdGlvbnMnKTtcblxuVHJhbnNhY3Rpb25zLmhlbHBlcnMoe1xuICAgIGJsb2NrKCl7XG4gICAgICAgIHJldHVybiBCbG9ja3Njb24uZmluZE9uZSh7aGVpZ2h0OnRoaXMuaGVpZ2h0fSk7XG4gICAgfVxufSkiLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFRyYW5zYWN0aW9ucyB9IGZyb20gJy4uLy4uL3RyYW5zYWN0aW9ucy90cmFuc2FjdGlvbnMuanMnO1xuaW1wb3J0IHsgQmxvY2tzY29uIH0gZnJvbSAnLi4vLi4vYmxvY2tzL2Jsb2Nrcy5qcyc7XG5pbXBvcnQgeyBEZWxlZ2F0aW9ucyB9IGZyb20gJy4uLy4uL2RlbGVnYXRpb25zL2RlbGVnYXRpb25zLmpzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICAgICdWYWxpZGF0b3JzLmZpbmRDcmVhdGVWYWxpZGF0b3JUaW1lJzogZnVuY3Rpb24oYWRkcmVzcyl7XG4gICAgICAgIC8vIGxvb2sgdXAgdGhlIGNyZWF0ZSB2YWxpZGF0b3IgdGltZSB0byBjb25zaWRlciBpZiB0aGUgdmFsaWRhdG9yIGhhcyBuZXZlciB1cGRhdGVkIHRoZSBjb21taXNzaW9uXG4gICAgICAgIGxldCB0eCA9IFRyYW5zYWN0aW9ucy5maW5kT25lKHskYW5kOltcbiAgICAgICAgICAgIHtcInR4LnZhbHVlLm1zZy52YWx1ZS5kZWxlZ2F0b3JfYWRkcmVzc1wiOmFkZHJlc3N9LFxuICAgICAgICAgICAge1widHgudmFsdWUubXNnLnR5cGVcIjpcImNvc21vcy1zZGsvTXNnQ3JlYXRlVmFsaWRhdG9yXCJ9LFxuICAgICAgICAgICAge2NvZGU6eyRleGlzdHM6ZmFsc2V9fVxuICAgICAgICBdfSk7XG5cbiAgICAgICAgaWYgKHR4KXtcbiAgICAgICAgICAgIGxldCBibG9jayA9IEJsb2Nrc2Nvbi5maW5kT25lKHtoZWlnaHQ6dHguaGVpZ2h0fSk7XG4gICAgICAgICAgICBpZiAoYmxvY2spe1xuICAgICAgICAgICAgICAgIHJldHVybiBibG9jay50aW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICAvLyBubyBzdWNoIGNyZWF0ZSB2YWxpZGF0b3IgdHhcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLy8gYXN5bmMgJ1ZhbGlkYXRvcnMuZ2V0QWxsRGVsZWdhdGlvbnMnKGFkZHJlc3Mpe1xuICAgICdWYWxpZGF0b3JzLmdldEFsbERlbGVnYXRpb25zJyhhZGRyZXNzKXtcbiAgICAgICAgbGV0IHVybCA9IExDRCArICcvc3Rha2luZy92YWxpZGF0b3JzLycrYWRkcmVzcysnL2RlbGVnYXRpb25zJztcbiAgICAgICAgXG4gICAgICAgIHRyeXtcbiAgICAgICAgICAgIGxldCBkZWxlZ2F0aW9ucyA9IEhUVFAuZ2V0KHVybCk7XG4gICAgICAgICAgICBpZiAoZGVsZWdhdGlvbnMuc3RhdHVzQ29kZSA9PSAyMDApe1xuICAgICAgICAgICAgICAgIGRlbGVnYXRpb25zID0gSlNPTi5wYXJzZShkZWxlZ2F0aW9ucy5jb250ZW50KTtcbiAgICAgICAgICAgICAgICBkZWxlZ2F0aW9ucy5mb3JFYWNoKChkZWxlZ2F0aW9uLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWxlZ2F0aW9uc1tpXSAmJiBkZWxlZ2F0aW9uc1tpXS5zaGFyZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxlZ2F0aW9uc1tpXS5zaGFyZXMgPSBwYXJzZUZsb2F0KGRlbGVnYXRpb25zW2ldLnNoYXJlcyk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZXR1cm4gZGVsZWdhdGlvbnM7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICB9XG4gICAgfVxufSk7IiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBWYWxpZGF0b3JzIH0gZnJvbSAnLi4vdmFsaWRhdG9ycy5qcyc7XG5pbXBvcnQgeyBWYWxpZGF0b3JSZWNvcmRzIH0gZnJvbSAnLi4vLi4vcmVjb3Jkcy9yZWNvcmRzLmpzJztcbmltcG9ydCB7IFZvdGluZ1Bvd2VySGlzdG9yeSB9IGZyb20gJy4uLy4uL3ZvdGluZy1wb3dlci9oaXN0b3J5LmpzJztcblxuTWV0ZW9yLnB1Ymxpc2goJ3ZhbGlkYXRvcnMuYWxsJywgZnVuY3Rpb24gKHNvcnQgPSBcImRlc2NyaXB0aW9uLm1vbmlrZXJcIiwgZGlyZWN0aW9uID0gLTEpIHtcbiAgICByZXR1cm4gVmFsaWRhdG9ycy5maW5kKHt9KTtcbn0pO1xuXG5wdWJsaXNoQ29tcG9zaXRlKCd2YWxpZGF0b3JzLmZpcnN0U2Vlbicse1xuICAgIGZpbmQoKSB7XG4gICAgICAgIHJldHVybiBWYWxpZGF0b3JzLmZpbmQoe30pO1xuICAgIH0sXG4gICAgY2hpbGRyZW46IFtcbiAgICAgICAge1xuICAgICAgICAgICAgZmluZCh2YWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVmFsaWRhdG9yUmVjb3Jkcy5maW5kKFxuICAgICAgICAgICAgICAgICAgICB7IGFkZHJlc3M6IHZhbC5hZGRyZXNzIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgc29ydDoge2hlaWdodDogMX0sIGxpbWl0OiAxfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICBdXG59KTtcblxuTWV0ZW9yLnB1Ymxpc2goJ3ZhbGlkYXRvcnMudm90aW5nX3Bvd2VyJywgZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gVmFsaWRhdG9ycy5maW5kKHtcbiAgICAgICAgc3RhdHVzOiAyLFxuICAgICAgICBqYWlsZWQ6ZmFsc2VcbiAgICB9LHtcbiAgICAgICAgc29ydDp7XG4gICAgICAgICAgICB2b3RpbmdfcG93ZXI6LTFcbiAgICAgICAgfSxcbiAgICAgICAgZmllbGRzOntcbiAgICAgICAgICAgIGFkZHJlc3M6IDEsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjoxLFxuICAgICAgICAgICAgdm90aW5nX3Bvd2VyOjFcbiAgICAgICAgfVxuICAgIH1cbiAgICApO1xufSk7XG5cbnB1Ymxpc2hDb21wb3NpdGUoJ3ZhbGlkYXRvci5kZXRhaWxzJywgZnVuY3Rpb24oYWRkcmVzcyl7XG4gICAgbGV0IG9wdGlvbnMgPSB7YWRkcmVzczphZGRyZXNzfTtcbiAgICBpZiAoYWRkcmVzcy5pbmRleE9mKE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuYmVjaDMyUHJlZml4VmFsQWRkcikgIT0gLTEpe1xuICAgICAgICBvcHRpb25zID0ge29wZXJhdG9yX2FkZHJlc3M6YWRkcmVzc31cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmluZCgpe1xuICAgICAgICAgICAgcmV0dXJuIFZhbGlkYXRvcnMuZmluZChvcHRpb25zKVxuICAgICAgICB9LFxuICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpbmQodmFsKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFZvdGluZ1Bvd2VySGlzdG9yeS5maW5kKFxuICAgICAgICAgICAgICAgICAgICAgICAge2FkZHJlc3M6dmFsLmFkZHJlc3N9LFxuICAgICAgICAgICAgICAgICAgICAgICAge3NvcnQ6e2hlaWdodDotMX0sIGxpbWl0OjUwfVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaW5kKHZhbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVmFsaWRhdG9yUmVjb3Jkcy5maW5kKFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBhZGRyZXNzOiB2YWwuYWRkcmVzcyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBzb3J0OiB7aGVpZ2h0OiAtMX0sIGxpbWl0OiBNZXRlb3Iuc2V0dGluZ3MucHVibGljLnVwdGltZVdpbmRvd31cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9XG59KTtcbiIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IFZhbGlkYXRvclJlY29yZHMgfSBmcm9tICcuLi9yZWNvcmRzL3JlY29yZHMuanMnO1xuaW1wb3J0IHsgVm90aW5nUG93ZXJIaXN0b3J5IH0gZnJvbSAnLi4vdm90aW5nLXBvd2VyL2hpc3RvcnkuanMnO1xuXG5leHBvcnQgY29uc3QgVmFsaWRhdG9ycyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCd2YWxpZGF0b3JzJyk7XG5cblZhbGlkYXRvcnMuaGVscGVycyh7XG4gICAgZmlyc3RTZWVuKCl7XG4gICAgICAgIHJldHVybiBWYWxpZGF0b3JSZWNvcmRzLmZpbmRPbmUoe2FkZHJlc3M6dGhpcy5hZGRyZXNzfSk7XG4gICAgfSxcbiAgICBoaXN0b3J5KCl7XG4gICAgICAgIHJldHVybiBWb3RpbmdQb3dlckhpc3RvcnkuZmluZCh7YWRkcmVzczp0aGlzLmFkZHJlc3N9LCB7c29ydDp7aGVpZ2h0Oi0xfSwgbGltaXQ6NTB9KS5mZXRjaCgpO1xuICAgIH1cbn0pXG4vLyBWYWxpZGF0b3JzLmhlbHBlcnMoe1xuLy8gICAgIHVwdGltZSgpe1xuLy8gICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmFkZHJlc3MpO1xuLy8gICAgICAgICBsZXQgbGFzdEh1bmRyZWQgPSBWYWxpZGF0b3JSZWNvcmRzLmZpbmQoe2FkZHJlc3M6dGhpcy5hZGRyZXNzfSwge3NvcnQ6e2hlaWdodDotMX0sIGxpbWl0OjEwMH0pLmZldGNoKCk7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKGxhc3RIdW5kcmVkKTtcbi8vICAgICAgICAgbGV0IHVwdGltZSA9IDA7XG4vLyAgICAgICAgIGZvciAoaSBpbiBsYXN0SHVuZHJlZCl7XG4vLyAgICAgICAgICAgICBpZiAobGFzdEh1bmRyZWRbaV0uZXhpc3RzKXtcbi8vICAgICAgICAgICAgICAgICB1cHRpbWUrPTE7XG4vLyAgICAgICAgICAgICB9XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgcmV0dXJuIHVwdGltZTtcbi8vICAgICB9XG4vLyB9KSIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcblxuZXhwb3J0IGNvbnN0IFZvdGluZ1Bvd2VySGlzdG9yeSA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCd2b3RpbmdfcG93ZXJfaGlzdG9yeScpO1xuIiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuXG5leHBvcnQgY29uc3QgRXZpZGVuY2VzID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ2V2aWRlbmNlcycpO1xuIiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuXG5leHBvcnQgY29uc3QgVmFsaWRhdG9yU2V0cyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCd2YWxpZGF0b3Jfc2V0cycpO1xuIiwiLy8gSW1wb3J0IG1vZHVsZXMgdXNlZCBieSBib3RoIGNsaWVudCBhbmQgc2VydmVyIHRocm91Z2ggYSBzaW5nbGUgaW5kZXggZW50cnkgcG9pbnRcbi8vIGUuZy4gdXNlcmFjY291bnRzIGNvbmZpZ3VyYXRpb24gZmlsZS5cbiIsImltcG9ydCB7IEJsb2Nrc2NvbiB9IGZyb20gJy4uLy4uL2FwaS9ibG9ja3MvYmxvY2tzLmpzJztcbmltcG9ydCB7IFByb3Bvc2FscyB9IGZyb20gJy4uLy4uL2FwaS9wcm9wb3NhbHMvcHJvcG9zYWxzLmpzJztcbmltcG9ydCB7IEZ1bmRpbmdDeWNsZXNzIH0gZnJvbSAnLi4vLi4vYXBpL2Z1bmRpbmdjeWNsZXMvZnVuZGluZ2N5Y2xlcy5qcyc7XG5pbXBvcnQgeyBWYWxpZGF0b3JSZWNvcmRzLCBBbmFseXRpY3MsIE1pc3NlZEJsb2Nrc1N0YXRzLCBBdmVyYWdlRGF0YSwgQXZlcmFnZVZhbGlkYXRvckRhdGEgfSBmcm9tICcuLi8uLi9hcGkvcmVjb3Jkcy9yZWNvcmRzLmpzJztcbi8vIGltcG9ydCB7IFN0YXR1cyB9IGZyb20gJy4uLy4uL2FwaS9zdGF0dXMvc3RhdHVzLmpzJztcbmltcG9ydCB7IFRyYW5zYWN0aW9ucyB9IGZyb20gJy4uLy4uL2FwaS90cmFuc2FjdGlvbnMvdHJhbnNhY3Rpb25zLmpzJztcbmltcG9ydCB7IFZhbGlkYXRvclNldHMgfSBmcm9tICcuLi8uLi9hcGkvdmFsaWRhdG9yLXNldHMvdmFsaWRhdG9yLXNldHMuanMnO1xuaW1wb3J0IHsgVmFsaWRhdG9ycyB9IGZyb20gJy4uLy4uL2FwaS92YWxpZGF0b3JzL3ZhbGlkYXRvcnMuanMnO1xuaW1wb3J0IHsgVm90aW5nUG93ZXJIaXN0b3J5IH0gZnJvbSAnLi4vLi4vYXBpL3ZvdGluZy1wb3dlci9oaXN0b3J5LmpzJztcbmltcG9ydCB7IEV2aWRlbmNlcyB9IGZyb20gJy4uLy4uL2FwaS9ldmlkZW5jZXMvZXZpZGVuY2VzLmpzJztcbmltcG9ydCB7IENvaW5TdGF0cyB9IGZyb20gJy4uLy4uL2FwaS9jb2luLXN0YXRzL2NvaW4tc3RhdHMuanMnO1xuaW1wb3J0IHsgQ2hhaW5TdGF0ZXMgfSBmcm9tICcuLi8uLi9hcGkvY2hhaW4vY2hhaW4uanMnO1xuXG5DaGFpblN0YXRlcy5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe2hlaWdodDogLTF9LHt1bmlxdWU6dHJ1ZX0pO1xuXG5CbG9ja3Njb24ucmF3Q29sbGVjdGlvbigpLmNyZWF0ZUluZGV4KHtoZWlnaHQ6IC0xfSx7dW5pcXVlOnRydWV9KTtcbkJsb2Nrc2Nvbi5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe3Byb3Bvc2VyQWRkcmVzczoxfSk7XG5cbkV2aWRlbmNlcy5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe2hlaWdodDogLTF9KTtcblxuUHJvcG9zYWxzLnJhd0NvbGxlY3Rpb24oKS5jcmVhdGVJbmRleCh7cHJvcG9zYWxJZDogMX0sIHt1bmlxdWU6dHJ1ZX0pO1xuXG5GdW5kaW5nQ3ljbGVzcy5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe2N5Y2xlSWQ6IDF9LCB7dW5pcXVlOnRydWV9KTtcblxuVmFsaWRhdG9yUmVjb3Jkcy5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe2FkZHJlc3M6MSxoZWlnaHQ6IC0xfSwge3VuaXF1ZToxfSk7XG5cbkFuYWx5dGljcy5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe2hlaWdodDogLTF9LCB7dW5pcXVlOnRydWV9KVxuXG5NaXNzZWRCbG9ja3NTdGF0cy5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe3Byb3Bvc2VyOjF9KTtcbk1pc3NlZEJsb2Nrc1N0YXRzLnJhd0NvbGxlY3Rpb24oKS5jcmVhdGVJbmRleCh7dm90ZXI6MX0pO1xuTWlzc2VkQmxvY2tzU3RhdHMucmF3Q29sbGVjdGlvbigpLmNyZWF0ZUluZGV4KHtwcm9wb3NlcjoxLCB2b3RlcjoxfSx7dW5pcXVlOnRydWV9KTtcblxuQXZlcmFnZURhdGEucmF3Q29sbGVjdGlvbigpLmNyZWF0ZUluZGV4KHt0eXBlOjEsIGNyZWF0ZWRBdDotMX0se3VuaXF1ZTp0cnVlfSk7XG5BdmVyYWdlVmFsaWRhdG9yRGF0YS5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe3Byb3Bvc2VyQWRkcmVzczoxLGNyZWF0ZWRBdDotMX0se3VuaXF1ZTp0cnVlfSk7XG4vLyBTdGF0dXMucmF3Q29sbGVjdGlvbi5jcmVhdGVJbmRleCh7fSlcblxuVHJhbnNhY3Rpb25zLnJhd0NvbGxlY3Rpb24oKS5jcmVhdGVJbmRleCh7dHhoYXNoOjF9LHt1bmlxdWU6dHJ1ZX0pO1xuVHJhbnNhY3Rpb25zLnJhd0NvbGxlY3Rpb24oKS5jcmVhdGVJbmRleCh7aGVpZ2h0Oi0xfSk7XG4vLyBUcmFuc2FjdGlvbnMucmF3Q29sbGVjdGlvbigpLmNyZWF0ZUluZGV4KHthY3Rpb246MX0pO1xuVHJhbnNhY3Rpb25zLnJhd0NvbGxlY3Rpb24oKS5jcmVhdGVJbmRleCh7XCJ0YWdzLmtleVwiOjF9KTtcblRyYW5zYWN0aW9ucy5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe1widGFncy52YWx1ZVwiOjF9KTtcblxuVmFsaWRhdG9yU2V0cy5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe2Jsb2NrX2hlaWdodDotMX0pO1xuXG5WYWxpZGF0b3JzLnJhd0NvbGxlY3Rpb24oKS5jcmVhdGVJbmRleCh7YWRkcmVzczoxfSx7dW5pcXVlOnRydWUsIHBhcnRpYWxGaWx0ZXJFeHByZXNzaW9uOiB7IGFkZHJlc3M6IHsgJGV4aXN0czogdHJ1ZSB9IH0gfSk7XG5WYWxpZGF0b3JzLnJhd0NvbGxlY3Rpb24oKS5jcmVhdGVJbmRleCh7Y29uc2Vuc3VzX3B1YmtleToxfSx7dW5pcXVlOnRydWV9KTtcblZhbGlkYXRvcnMucmF3Q29sbGVjdGlvbigpLmNyZWF0ZUluZGV4KHtcInB1Yl9rZXkudmFsdWVcIjoxfSx7dW5pcXVlOnRydWUsIHBhcnRpYWxGaWx0ZXJFeHByZXNzaW9uOiB7IFwicHViX2tleS52YWx1ZVwiOiB7ICRleGlzdHM6IHRydWUgfSB9fSk7XG5cblZvdGluZ1Bvd2VySGlzdG9yeS5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe2FkZHJlc3M6MSxoZWlnaHQ6LTF9KTtcblZvdGluZ1Bvd2VySGlzdG9yeS5yYXdDb2xsZWN0aW9uKCkuY3JlYXRlSW5kZXgoe3R5cGU6MX0pO1xuXG5Db2luU3RhdHMucmF3Q29sbGVjdGlvbigpLmNyZWF0ZUluZGV4KHtsYXN0X3VwZGF0ZWRfYXQ6LTF9LHt1bmlxdWU6dHJ1ZX0pO1xuIiwiLy8gSW1wb3J0IHNlcnZlciBzdGFydHVwIHRocm91Z2ggYSBzaW5nbGUgaW5kZXggZW50cnkgcG9pbnRcblxuaW1wb3J0ICcuL3V0aWwuanMnO1xuaW1wb3J0ICcuL3JlZ2lzdGVyLWFwaS5qcyc7XG5pbXBvcnQgJy4vY3JlYXRlLWluZGV4ZXMuanMnO1xuXG4vLyBpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuLy8gaW1wb3J0IHsgcmVuZGVyVG9Ob2RlU3RyZWFtIH0gZnJvbSAncmVhY3QtZG9tL3NlcnZlcic7XG4vLyBpbXBvcnQgeyByZW5kZXJUb1N0cmluZyB9IGZyb20gXCJyZWFjdC1kb20vc2VydmVyXCI7XG5pbXBvcnQgeyBvblBhZ2VMb2FkIH0gZnJvbSAnbWV0ZW9yL3NlcnZlci1yZW5kZXInO1xuLy8gaW1wb3J0IHsgU3RhdGljUm91dGVyIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XG4vLyBpbXBvcnQgeyBTZXJ2ZXJTdHlsZVNoZWV0IH0gZnJvbSBcInN0eWxlZC1jb21wb25lbnRzXCJcbmltcG9ydCB7IEhlbG1ldCB9IGZyb20gJ3JlYWN0LWhlbG1ldCc7XG5cbi8vIGltcG9ydCBBcHAgZnJvbSAnLi4vLi4vdWkvQXBwLmpzeCc7XG5cbm9uUGFnZUxvYWQoc2luayA9PiB7XG4gICAgLy8gY29uc3QgY29udGV4dCA9IHt9O1xuICAgIC8vIGNvbnN0IHNoZWV0ID0gbmV3IFNlcnZlclN0eWxlU2hlZXQoKVxuXG4gICAgLy8gY29uc3QgaHRtbCA9IHJlbmRlclRvU3RyaW5nKHNoZWV0LmNvbGxlY3RTdHlsZXMoXG4gICAgLy8gICAgIDxTdGF0aWNSb3V0ZXIgbG9jYXRpb249e3NpbmsucmVxdWVzdC51cmx9IGNvbnRleHQ9e2NvbnRleHR9PlxuICAgIC8vICAgICAgICAgPEFwcCAvPlxuICAgIC8vICAgICA8L1N0YXRpY1JvdXRlcj5cbiAgICAvLyAgICkpO1xuXG4gICAgLy8gc2luay5yZW5kZXJJbnRvRWxlbWVudEJ5SWQoJ2FwcCcsIGh0bWwpO1xuXG4gICAgY29uc3QgaGVsbWV0ID0gSGVsbWV0LnJlbmRlclN0YXRpYygpO1xuICAgIHNpbmsuYXBwZW5kVG9IZWFkKGhlbG1ldC5tZXRhLnRvU3RyaW5nKCkpO1xuICAgIHNpbmsuYXBwZW5kVG9IZWFkKGhlbG1ldC50aXRsZS50b1N0cmluZygpKTtcblxuICAgIC8vIHNpbmsuYXBwZW5kVG9IZWFkKHNoZWV0LmdldFN0eWxlVGFncygpKTtcbn0pOyIsIi8vIFJlZ2lzdGVyIHlvdXIgYXBpcyBoZXJlXG5cbmltcG9ydCAnLi4vLi4vYXBpL2NoYWluL3NlcnZlci9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL2NoYWluL3NlcnZlci9wdWJsaWNhdGlvbnMuanMnO1xuXG5pbXBvcnQgJy4uLy4uL2FwaS9ibG9ja3Mvc2VydmVyL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvYmxvY2tzL3NlcnZlci9wdWJsaWNhdGlvbnMuanMnO1xuXG5pbXBvcnQgJy4uLy4uL2FwaS92YWxpZGF0b3JzL3NlcnZlci9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3ZhbGlkYXRvcnMvc2VydmVyL3B1YmxpY2F0aW9ucy5qcyc7XG5cbmltcG9ydCAnLi4vLi4vYXBpL3JlY29yZHMvc2VydmVyL21ldGhvZHMuanMnO1xuaW1wb3J0ICcuLi8uLi9hcGkvcmVjb3Jkcy9zZXJ2ZXIvcHVibGljYXRpb25zLmpzJztcblxuaW1wb3J0ICcuLi8uLi9hcGkvcHJvcG9zYWxzL3NlcnZlci9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL3Byb3Bvc2Fscy9zZXJ2ZXIvcHVibGljYXRpb25zLmpzJztcblxuaW1wb3J0ICcuLi8uLi9hcGkvZnVuZGluZ2N5Y2xlcy9zZXJ2ZXIvbWV0aG9kcy5qcyc7XG5pbXBvcnQgJy4uLy4uL2FwaS9mdW5kaW5nY3ljbGVzL3NlcnZlci9wdWJsaWNhdGlvbnMuanMnO1xuXG5pbXBvcnQgJy4uLy4uL2FwaS92b3RpbmctcG93ZXIvc2VydmVyL3B1YmxpY2F0aW9ucy5qcyc7XG5cbmltcG9ydCAnLi4vLi4vYXBpL3RyYW5zYWN0aW9ucy9zZXJ2ZXIvbWV0aG9kcy5qcyc7XG5pbXBvcnQgJy4uLy4uL2FwaS90cmFuc2FjdGlvbnMvc2VydmVyL3B1YmxpY2F0aW9ucy5qcyc7XG5cbmltcG9ydCAnLi4vLi4vYXBpL2RlbGVnYXRpb25zL3NlcnZlci9tZXRob2RzLmpzJztcbmltcG9ydCAnLi4vLi4vYXBpL2RlbGVnYXRpb25zL3NlcnZlci9wdWJsaWNhdGlvbnMuanMnO1xuXG5pbXBvcnQgJy4uLy4uL2FwaS9zdGF0dXMvc2VydmVyL3B1YmxpY2F0aW9ucy5qcyc7XG5cbmltcG9ydCAnLi4vLi4vYXBpL2FjY291bnRzL3NlcnZlci9tZXRob2RzLmpzJztcblxuaW1wb3J0ICcuLi8uLi9hcGkvY29pbi1zdGF0cy9zZXJ2ZXIvbWV0aG9kcy5qcyc7IiwiaW1wb3J0IGJlY2gzMiBmcm9tICdiZWNoMzInXG5pbXBvcnQgeyBIVFRQIH0gZnJvbSAnbWV0ZW9yL2h0dHAnO1xuaW1wb3J0ICogYXMgY2hlZXJpbyBmcm9tICdjaGVlcmlvJztcblxuLy8gTG9hZCBmdXR1cmUgZnJvbSBmaWJlcnNcbnZhciBGdXR1cmUgPSBOcG0ucmVxdWlyZShcImZpYmVycy9mdXR1cmVcIik7XG4vLyBMb2FkIGV4ZWNcbnZhciBleGVjID0gTnBtLnJlcXVpcmUoXCJjaGlsZF9wcm9jZXNzXCIpLmV4ZWM7XG5cbmZ1bmN0aW9uIHRvSGV4U3RyaW5nKGJ5dGVBcnJheSkge1xuICAgIHJldHVybiBieXRlQXJyYXkubWFwKGZ1bmN0aW9uKGJ5dGUpIHtcbiAgICAgICAgcmV0dXJuICgnMCcgKyAoYnl0ZSAmIDB4RkYpLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTIpO1xuICAgIH0pLmpvaW4oJycpXG59XG5cbk1ldGVvci5tZXRob2RzKHtcbiAgICBwdWJrZXlUb0JlY2gzMjogZnVuY3Rpb24ocHVia2V5LCBwcmVmaXgpIHtcbiAgICAgICAgLy8gJzE2MjRERTY0MjAnIGlzIGVkMjU1MTkgcHVia2V5IHByZWZpeFxuICAgICAgICBsZXQgcHVia2V5QW1pbm9QcmVmaXggPSBCdWZmZXIuZnJvbSgnMTYyNERFNjQyMCcsICdoZXgnKVxuICAgICAgICBsZXQgYnVmZmVyID0gQnVmZmVyLmFsbG9jKDM3KVxuICAgICAgICBwdWJrZXlBbWlub1ByZWZpeC5jb3B5KGJ1ZmZlciwgMClcbiAgICAgICAgQnVmZmVyLmZyb20ocHVia2V5LnZhbHVlLCAnYmFzZTY0JykuY29weShidWZmZXIsIHB1YmtleUFtaW5vUHJlZml4Lmxlbmd0aClcbiAgICAgICAgcmV0dXJuIGJlY2gzMi5lbmNvZGUocHJlZml4LCBiZWNoMzIudG9Xb3JkcyhidWZmZXIpKVxuICAgIH0sXG4gICAgYmVjaDMyVG9QdWJrZXk6IGZ1bmN0aW9uKHB1YmtleSkge1xuICAgICAgICAvLyAnMTYyNERFNjQyMCcgaXMgZWQyNTUxOSBwdWJrZXkgcHJlZml4XG4gICAgICAgIGxldCBwdWJrZXlBbWlub1ByZWZpeCA9IEJ1ZmZlci5mcm9tKCcxNjI0REU2NDIwJywgJ2hleCcpXG4gICAgICAgIGxldCBidWZmZXIgPSBCdWZmZXIuZnJvbShiZWNoMzIuZnJvbVdvcmRzKGJlY2gzMi5kZWNvZGUocHVia2V5KS53b3JkcykpO1xuICAgICAgICByZXR1cm4gYnVmZmVyLnNsaWNlKHB1YmtleUFtaW5vUHJlZml4Lmxlbmd0aCkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICAgIH0sXG4gICAgZ2V0RGVsZWdhdG9yOiBmdW5jdGlvbihvcGVyYXRvckFkZHIpe1xuICAgICAgICBsZXQgYWRkcmVzcyA9IGJlY2gzMi5kZWNvZGUob3BlcmF0b3JBZGRyKTtcbiAgICAgICAgcmV0dXJuIGJlY2gzMi5lbmNvZGUoTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5iZWNoMzJQcmVmaXhBY2NBZGRyLCBhZGRyZXNzLndvcmRzKTtcbiAgICB9LFxuICAgIGdldEtleWJhc2VUZWFtUGljOiBmdW5jdGlvbihrZXliYXNlVXJsKXtcbiAgICAgICAgbGV0IHRlYW1QYWdlID0gSFRUUC5nZXQoa2V5YmFzZVVybCk7XG4gICAgICAgIGlmICh0ZWFtUGFnZS5zdGF0dXNDb2RlID09IDIwMCl7XG4gICAgICAgICAgICBsZXQgcGFnZSA9IGNoZWVyaW8ubG9hZCh0ZWFtUGFnZS5jb250ZW50KTtcbiAgICAgICAgICAgIHJldHVybiBwYWdlKFwiLmtiLW1haW4tY2FyZCBpbWdcIikuYXR0cignc3JjJyk7XG4gICAgICAgIH1cbiAgICB9XG59KVxuIiwiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0Jztcbi8vIGltcG9ydCB7IEJhZGdlIH0gZnJvbSAncmVhY3RzdHJhcCc7XG5pbXBvcnQgaTE4biBmcm9tICdtZXRlb3IvdW5pdmVyc2U6aTE4bic7XG5cbmNvbnN0IFQgPSBpMThuLmNyZWF0ZUNvbXBvbmVudCgpO1xuZXhwb3J0IGNvbnN0IERlbm9tU3ltYm9sID0gKHByb3BzKSA9PiB7XG4gICAgc3dpdGNoIChwcm9wcy5kZW5vbSl7XG4gICAgY2FzZSBcInN0ZWFrXCI6XG4gICAgICAgIHJldHVybiAn8J+lqSc7XG4gICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICfwn42FJztcbiAgICB9XG59XG5cblxuZXhwb3J0IGNvbnN0IFByb3Bvc2FsU3RhdHVzSWNvbiA9IChwcm9wcykgPT4ge1xuICAgIHN3aXRjaCAocHJvcHMuc3RhdHVzKXtcbiAgICBjYXNlICdQYXNzZWQnOlxuICAgICAgICByZXR1cm4gPGkgY2xhc3NOYW1lPVwiZmFzIGZhLWNoZWNrLWNpcmNsZSB0ZXh0LXN1Y2Nlc3NcIj48L2k+O1xuICAgIGNhc2UgJ1JlamVjdGVkJzpcbiAgICAgICAgcmV0dXJuIDxpIGNsYXNzTmFtZT1cImZhcyBmYS10aW1lcy1jaXJjbGUgdGV4dC1kYW5nZXJcIj48L2k+O1xuICAgIGNhc2UgJ1JlbW92ZWQnOlxuICAgICAgICByZXR1cm4gPGkgY2xhc3NOYW1lPVwiZmFzIGZhLXRyYXNoLWFsdCB0ZXh0LWRhcmtcIj48L2k+XG4gICAgY2FzZSAnRGVwb3NpdFBlcmlvZCc6XG4gICAgICAgIHJldHVybiA8aSBjbGFzc05hbWU9XCJmYXMgZmEtYmF0dGVyeS1oYWxmIHRleHQtd2FybmluZ1wiPjwvaT47XG4gICAgY2FzZSAnVm90aW5nUGVyaW9kJzpcbiAgICAgICAgcmV0dXJuIDxpIGNsYXNzTmFtZT1cImZhcyBmYS1oYW5kLXBhcGVyIHRleHQtaW5mb1wiPjwvaT47XG4gICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIDxpPjwvaT47XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgVm90ZUljb24gPSAocHJvcHMpID0+IHtcbiAgICBzd2l0Y2ggKHByb3BzLnZvdGUpe1xuICAgIGNhc2UgJ3llcyc6XG4gICAgICAgIHJldHVybiA8aSBjbGFzc05hbWU9XCJmYXMgZmEtY2hlY2sgdGV4dC1zdWNjZXNzXCI+PC9pPjtcbiAgICBjYXNlICdubyc6XG4gICAgICAgIHJldHVybiA8aSBjbGFzc05hbWU9XCJmYXMgZmEtdGltZXMgdGV4dC1kYW5nZXJcIj48L2k+O1xuICAgIGNhc2UgJ2Fic3RhaW4nOlxuICAgICAgICByZXR1cm4gPGkgY2xhc3NOYW1lPVwiZmFzIGZhLXVzZXItc2xhc2ggdGV4dC13YXJuaW5nXCI+PC9pPjtcbiAgICBjYXNlICdub193aXRoX3ZldG8nOlxuICAgICAgICByZXR1cm4gPGkgY2xhc3NOYW1lPVwiZmFzIGZhLWV4Y2xhbWF0aW9uLXRyaWFuZ2xlIHRleHQtaW5mb1wiPjwvaT47XG4gICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIDxpPjwvaT47XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgVHhJY29uID0gKHByb3BzKSA9PiB7XG4gICAgaWYgKHByb3BzLnZhbGlkKXtcbiAgICAgICAgcmV0dXJuIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc3VjY2VzcyB0ZXh0LW5vd3JhcFwiPjxpIGNsYXNzTmFtZT1cImZhcyBmYS1jaGVjay1jaXJjbGVcIj5TdWNjZXNzPC9pPjwvc3Bhbj47XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICAgIHJldHVybiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWRhbmdlciB0ZXh0LW5vd3JhcFwiPjxpIGNsYXNzTmFtZT1cImZhcyBmYS10aW1lcy1jaXJjbGVcIj5GYWlsZWQ8L2k+PC9zcGFuPjtcbiAgICB9XG59IiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgbnVtYnJvIGZyb20gJ251bWJybyc7XG5cbmF1dG9mb3JtYXQgPSAodmFsdWUpID0+IHtcblx0bGV0IGZvcm1hdHRlciA9ICcwLDAuMDAwMCc7XG5cdHZhbHVlID0gTWF0aC5yb3VuZCh2YWx1ZSAqIDEwMDApIC8gMTAwMFxuXHRpZiAoTWF0aC5yb3VuZCh2YWx1ZSkgPT09IHZhbHVlKVxuXHRcdGZvcm1hdHRlciA9ICcwLDAnXG5cdGVsc2UgaWYgKE1hdGgucm91bmQodmFsdWUqMTApID09PSB2YWx1ZSoxMClcblx0XHRmb3JtYXR0ZXIgPSAnMCwwLjAnXG5cdGVsc2UgaWYgKE1hdGgucm91bmQodmFsdWUqMTAwKSA9PT0gdmFsdWUqMTAwKVxuXHRcdGZvcm1hdHRlciA9ICcwLDAuMDAnXG5cdGVsc2UgaWYgKE1hdGgucm91bmQodmFsdWUqMTAwMCkgPT09IHZhbHVlKjEwMDApXG5cdFx0Zm9ybWF0dGVyID0gJzAsMC4wMDAnXG5cdHJldHVybiBudW1icm8odmFsdWUpLmZvcm1hdChmb3JtYXR0ZXIpXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvaW4ge1xuXHRzdGF0aWMgU3Rha2luZ0Rlbm9tID0gTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5zdGFraW5nRGVub20udG9Mb3dlckNhc2UoKTtcblx0c3RhdGljIE1pbnRpbmdEZW5vbSA9IE1ldGVvci5zZXR0aW5ncy5wdWJsaWMubWludGluZ0Rlbm9tLnRvTG93ZXJDYXNlKCk7XG5cdHN0YXRpYyBTdGFraW5nRnJhY3Rpb24gPSBOdW1iZXIoTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5zdGFraW5nRnJhY3Rpb24pO1xuXHRzdGF0aWMgTWluU3Rha2UgPSAxIC8gTnVtYmVyKE1ldGVvci5zZXR0aW5ncy5wdWJsaWMuc3Rha2luZ0ZyYWN0aW9uKTtcblxuXHRjb25zdHJ1Y3RvcihhbW91bnQsIGRlbm9tPW51bGwpIHtcblx0XHRpZiAodHlwZW9mIGFtb3VudCA9PT0gJ29iamVjdCcpXG5cdFx0XHQoe2Ftb3VudCwgZGVub219ID0gYW1vdW50KVxuXHRcdGlmICghZGVub20gfHwgZGVub20udG9Mb3dlckNhc2UoKSA9PT0gQ29pbi5NaW50aW5nRGVub20pIHtcblx0XHRcdHRoaXMuX2Ftb3VudCA9IE51bWJlcihhbW91bnQpO1xuXHRcdH0gZWxzZSBpZiAoZGVub20udG9Mb3dlckNhc2UoKSA9PT0gQ29pbi5TdGFraW5nRGVub20pIHtcblx0XHRcdHRoaXMuX2Ftb3VudCA9IE51bWJlcihhbW91bnQpICogQ29pbi5TdGFraW5nRnJhY3Rpb247XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dGhyb3cgRXJyb3IoYHVuc3VwcG9ydGVkIGRlbm9tICR7ZGVub219YCk7XG5cdFx0fVxuXHR9XG5cblx0Z2V0IGFtb3VudCAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2Ftb3VudDtcblx0fVxuXG5cdGdldCBzdGFraW5nQW1vdW50ICgpIHtcblx0XHRyZXR1cm4gdGhpcy5fYW1vdW50O1xuXHR9XG5cblx0dG9TdHJpbmcgKHByZWNpc2lvbikge1xuXHRcdC8vIGRlZmF1bHQgdG8gZGlzcGxheSBpbiBtaW50IGRlbm9tIGlmIGl0IGhhcyBtb3JlIHRoYW4gNCBkZWNpbWFsIHBsYWNlc1xuXHRcdGxldCBtaW5TdGFrZSA9IENvaW4uU3Rha2luZ0ZyYWN0aW9uLyhwcmVjaXNpb24/TWF0aC5wb3coMTAsIHByZWNpc2lvbik6MTAwMDApXG5cdFx0aWYgKHRoaXMuYW1vdW50IDwgbWluU3Rha2UpIHtcblx0XHRcdHJldHVybiBgJHtudW1icm8odGhpcy5hbW91bnQpLmZvcm1hdCgnMCwwJyl9ICR7Q29pbi5NaW50aW5nRGVub219YDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGAke3ByZWNpc2lvbj9udW1icm8odGhpcy5zdGFraW5nQW1vdW50KS5mb3JtYXQoJzAsMC4nICsgJzAnLnJlcGVhdChwcmVjaXNpb24pKTphdXRvZm9ybWF0KHRoaXMuc3Rha2luZ0Ftb3VudCl9ICR7Q29pbi5NaW50aW5nRGVub219YFxuXHRcdH1cblx0fVxuXG5cdG1pbnRTdHJpbmcgKGZvcm1hdHRlcikge1xuXHRcdGxldCBhbW91bnQgPSB0aGlzLmFtb3VudFxuXHRcdGlmIChmb3JtYXR0ZXIpIHtcblx0XHRcdGFtb3VudCA9IG51bWJybyhhbW91bnQpLmZvcm1hdChmb3JtYXR0ZXIpXG5cdFx0fVxuXHRcdHJldHVybiBgJHthbW91bnR9ICR7Q29pbi5NaW50aW5nRGVub219YDtcblx0fVxuXG5cdHN0YWtlU3RyaW5nIChmb3JtYXR0ZXIpIHtcblx0XHRsZXQgYW1vdW50ID0gdGhpcy5zdGFraW5nQW1vdW50XG5cdFx0aWYgKGZvcm1hdHRlcikge1xuXHRcdFx0YW1vdW50ID0gbnVtYnJvKGFtb3VudCkuZm9ybWF0KGZvcm1hdHRlcilcblx0XHR9XG5cdFx0cmV0dXJuIGAke2Ftb3VudH0gJHtDb2luLk1pbnRpbmdEZW5vbX1gO1xuXHR9XG59IiwiLy8gU2VydmVyIGVudHJ5IHBvaW50LCBpbXBvcnRzIGFsbCBzZXJ2ZXIgY29kZVxuXG5pbXBvcnQgJy9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyJztcbmltcG9ydCAnL2ltcG9ydHMvc3RhcnR1cC9ib3RoJztcbi8vIGltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50Jztcbi8vIGltcG9ydCAnL2ltcG9ydHMvYXBpL2Jsb2Nrcy9ibG9ja3MuanMnO1xuXG5TWU5DSU5HID0gZmFsc2U7XG5DT1VOVE1JU1NFREJMT0NLUyA9IGZhbHNlO1xuUlBDID0gTWV0ZW9yLnNldHRpbmdzLnJlbW90ZS5ycGM7XG5MQ0QgPSBNZXRlb3Iuc2V0dGluZ3MucmVtb3RlLmxjZDtcbnRpbWVyQmxvY2tzID0gMDtcbnRpbWVyQ2hhaW4gPSAwO1xudGltZXJDb25zZW5zdXMgPSAwO1xudGltZXJQcm9wb3NhbCA9IDA7XG50aW1lckZ1bmRpbmdDeWNsZSA9IDA7XG50aW1lclByb3Bvc2Fsc1Jlc3VsdHMgPSAwO1xudGltZXJNaXNzZWRCbG9jayA9IDA7XG50aW1lckRlbGVnYXRpb24gPSAwO1xudGltZXJBZ2dyZWdhdGUgPSAwO1xuXG5cbnVwZGF0ZUNoYWluU3RhdHVzID0gKCkgPT4ge1xuICAgIE1ldGVvci5jYWxsKCdjaGFpbi51cGRhdGVTdGF0dXMnLCAoZXJyb3IsIHJlc3VsdCkgPT4ge1xuICAgICAgICBpZiAoZXJyb3Ipe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ1cGRhdGVTdGF0dXM6IFwiK2Vycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ1cGRhdGVTdGF0dXM6IFwiK3Jlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9KVxufVxuXG51cGRhdGVCbG9jayA9ICgpID0+IHtcbiAgICBNZXRlb3IuY2FsbCgnYmxvY2tzLmJsb2Nrc1VwZGF0ZScsIChlcnJvciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChlcnJvcil7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVwZGF0ZUJsb2NrczogXCIrZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVwZGF0ZUJsb2NrczogXCIrcmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH0pXG59XG5cbmdldENvbnNlbnN1c1N0YXRlID0gKCkgPT4ge1xuICAgIE1ldGVvci5jYWxsKCdjaGFpbi5nZXRDb25zZW5zdXNTdGF0ZScsIChlcnJvciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChlcnJvcil7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImdldCBjb25zZW5zdXM6IFwiK2Vycm9yKVxuICAgICAgICB9XG4gICAgfSlcbn1cblxuZ2V0UHJvcG9zYWxzID0gKCkgPT4ge1xuICAgIE1ldGVvci5jYWxsKCdwcm9wb3NhbHMuZ2V0UHJvcG9zYWxzJywgKGVycm9yLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0IHByb3Bvc2FsOiBcIisgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJnZXQgcHJvcG9zYWw6IFwiK3Jlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZ2V0RnVuZGluZ0N5Y2xlcyA9ICgpID0+IHtcbiAgICBNZXRlb3IuY2FsbCgnRnVuZGluZ0N5Y2xlcy5nZXRGdW5kaW5nQ3ljbGVzJywgKGVycm9yLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0IEZ1bmRpbmcgQ3ljbGU6IFwiKyBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc3VsdCl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImdldCBGdW5kaW5nIEN5Y2xlOiBcIityZXN1bHQpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmdldFByb3Bvc2Fsc1Jlc3VsdHMgPSAoKSA9PiB7XG4gICAgTWV0ZW9yLmNhbGwoJ3Byb3Bvc2Fscy5nZXRQcm9wb3NhbFJlc3VsdHMnLCAoZXJyb3IsIHJlc3VsdCkgPT4ge1xuICAgICAgICBpZiAoZXJyb3Ipe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJnZXQgcHJvcG9zYWxzIHJlc3VsdDogXCIrZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJnZXQgcHJvcG9zYWxzIHJlc3VsdDogXCIrcmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG51cGRhdGVNaXNzZWRCbG9ja1N0YXRzID0gKCkgPT4ge1xuICAgIE1ldGVvci5jYWxsKCdWYWxpZGF0b3JSZWNvcmRzLmNhbGN1bGF0ZU1pc3NlZEJsb2NrcycsIChlcnJvciwgcmVzdWx0KSA9PntcbiAgICAgICAgaWYgKGVycm9yKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibWlzc2Jsb2NrcyBlcnJvcjogXCIrIGVycm9yKVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJtaXNzZWQgYmxvY2tzIG9rOlwiICsgcmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5nZXREZWxlZ2F0aW9ucyA9ICgpID0+IHtcbiAgICBNZXRlb3IuY2FsbCgnZGVsZWdhdGlvbnMuZ2V0RGVsZWdhdGlvbnMnLCAoZXJyb3IsIHJlc3VsdCkgPT4ge1xuICAgICAgICBpZiAoZXJyb3Ipe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJnZXQgZGVsZWdhdGlvbiBlcnJvcjogXCIrIGVycm9yKVxuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImdldCBkZWxlZ3RhaW9ucyBvazogXCIrIHJlc3VsdClcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5hZ2dyZWdhdGVNaW51dGVseSA9ICgpID0+e1xuICAgIC8vIGRvaW5nIHNvbWV0aGluZyBldmVyeSBtaW5cbiAgICBNZXRlb3IuY2FsbCgnQW5hbHl0aWNzLmFnZ3JlZ2F0ZUJsb2NrVGltZUFuZFZvdGluZ1Bvd2VyJywgXCJtXCIsIChlcnJvciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChlcnJvcil7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImFnZ3JlZ2F0ZSBtaW51dGVseSBibG9jayB0aW1lIGVycm9yOiBcIitlcnJvcilcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJhZ2dyZWdhdGUgbWludXRlbHkgYmxvY2sgdGltZSBvazogXCIrcmVzdWx0KVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBNZXRlb3IuY2FsbCgnY29pblN0YXRzLmdldENvaW5TdGF0cycsIChlcnJvciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChlcnJvcil7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImdldCBjb2luIHN0YXRzOiBcIitlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0IGNvaW4gc3RhdHMgb2s6IFwiK3Jlc3VsdClcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5hZ2dyZWdhdGVIb3VybHkgPSAoKSA9PntcbiAgICAvLyBkb2luZyBzb21ldGhpbmcgZXZlcnkgaG91clxuICAgIE1ldGVvci5jYWxsKCdBbmFseXRpY3MuYWdncmVnYXRlQmxvY2tUaW1lQW5kVm90aW5nUG93ZXInLCBcImhcIiwgKGVycm9yLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYWdncmVnYXRlIGhvdXJseSBibG9jayB0aW1lIGVycm9yOiBcIitlcnJvcilcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJhZ2dyZWdhdGUgaG91cmx5IGJsb2NrIHRpbWUgb2s6IFwiK3Jlc3VsdClcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5hZ2dyZWdhdGVEYWlseSA9ICgpID0+e1xuICAgIC8vIGRvaW5nIHNvbXRoaW5nIGV2ZXJ5IGRheVxuICAgIE1ldGVvci5jYWxsKCdBbmFseXRpY3MuYWdncmVnYXRlQmxvY2tUaW1lQW5kVm90aW5nUG93ZXInLCBcImRcIiwgKGVycm9yLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYWdncmVnYXRlIGRhaWx5IGJsb2NrIHRpbWUgZXJyb3I6IFwiK2Vycm9yKVxuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImFnZ3JlZ2F0ZSBkYWlseSBibG9jayB0aW1lIG9rOiBcIityZXN1bHQpXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIE1ldGVvci5jYWxsKCdBbmFseXRpY3MuYWdncmVnYXRlVmFsaWRhdG9yRGFpbHlCbG9ja1RpbWUnLCAoZXJyb3IsIHJlc3VsdCkgPT4ge1xuICAgICAgICBpZiAoZXJyb3Ipe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJhZ2dyZWdhdGUgdmFsaWRhdG9ycyBibG9jayB0aW1lIGVycm9yOlwiKyBlcnJvcilcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYWdncmVnYXRlIHZhbGlkYXRvcnMgYmxvY2sgdGltZSBvazpcIisgcmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH0pXG59XG5cblxuXG5NZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpe1xuICAgIGlmIChNZXRlb3IuaXNEZXZlbG9wbWVudCl7XG4gICAgICAgIHByb2Nlc3MuZW52Lk5PREVfVExTX1JFSkVDVF9VTkFVVEhPUklaRUQgPSAwO1xuICAgIH1cblxuICAgIE1ldGVvci5jYWxsKCdjaGFpbi5nZW5lc2lzJywgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChlcnIpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzdWx0KXtcbiAgICAgICAgICAgIGlmIChNZXRlb3Iuc2V0dGluZ3MuZGVidWcuc3RhcnRUaW1lcil7XG4gICAgICAgICAgICAgICAgdGltZXJDb25zZW5zdXMgPSBNZXRlb3Iuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgZ2V0Q29uc2Vuc3VzU3RhdGUoKTtcbiAgICAgICAgICAgICAgICB9LCBNZXRlb3Iuc2V0dGluZ3MucGFyYW1zLmNvbnNlbnN1c0ludGVydmFsKTtcblxuICAgICAgICAgICAgICAgIHRpbWVyQmxvY2tzID0gTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUJsb2NrKCk7XG4gICAgICAgICAgICAgICAgfSwgTWV0ZW9yLnNldHRpbmdzLnBhcmFtcy5ibG9ja0ludGVydmFsKTtcblxuICAgICAgICAgICAgICAgIHRpbWVyQ2hhaW4gPSBNZXRlb3Iuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlQ2hhaW5TdGF0dXMoKTtcbiAgICAgICAgICAgICAgICB9LCBNZXRlb3Iuc2V0dGluZ3MucGFyYW1zLnN0YXR1c0ludGVydmFsKTtcblxuICAgICAgICAgICAgICAgIHRpbWVyUHJvcG9zYWwgPSBNZXRlb3Iuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgZ2V0UHJvcG9zYWxzKCk7XG4gICAgICAgICAgICAgICAgfSwgTWV0ZW9yLnNldHRpbmdzLnBhcmFtcy5wcm9wb3NhbEludGVydmFsKTtcblxuICAgICAgICAgICAgICAgIHRpbWVyRnVuZGluZ0N5Y2xlID0gTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIGdldEZ1bmRpbmdDeWNsZXMoKTtcbiAgICAgICAgICAgICAgICB9LCBNZXRlb3Iuc2V0dGluZ3MucGFyYW1zLmZ1bmRpbmdDeWNsZUludGVydmFsKTtcblxuICAgICAgICAgICAgICAgIHRpbWVyUHJvcG9zYWxzUmVzdWx0cyA9IE1ldGVvci5zZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBnZXRQcm9wb3NhbHNSZXN1bHRzKCk7XG4gICAgICAgICAgICAgICAgfSwgTWV0ZW9yLnNldHRpbmdzLnBhcmFtcy5wcm9wb3NhbEludGVydmFsKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aW1lck1pc3NlZEJsb2NrID0gTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZU1pc3NlZEJsb2NrU3RhdHMoKTtcbiAgICAgICAgICAgICAgICB9LCBNZXRlb3Iuc2V0dGluZ3MucGFyYW1zLm1pc3NlZEJsb2Nrc0ludGVydmFsKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRpbWVyRGVsZWdhdGlvbiA9IE1ldGVvci5zZXRJbnRlcnZhbChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBnZXREZWxlZ2F0aW9ucygpO1xuICAgICAgICAgICAgICAgIH0sIE1ldGVvci5zZXR0aW5ncy5wYXJhbXMuZGVsZWdhdGlvbkludGVydmFsKTtcblxuICAgICAgICAgICAgICAgIHRpbWVyQWdncmVnYXRlID0gTWV0ZW9yLnNldEludGVydmFsKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoKG5vdy5nZXRVVENTZWNvbmRzKCkgPT0gMCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlTWludXRlbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICgobm93LmdldFVUQ01pbnV0ZXMoKSA9PSAwKSAmJiAobm93LmdldFVUQ1NlY29uZHMoKSA9PSAwKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVIb3VybHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICgobm93LmdldFVUQ0hvdXJzKCkgPT0gMCkgJiYgKG5vdy5nZXRVVENNaW51dGVzKCkgPT0gMCkgJiYgKG5vdy5nZXRVVENTZWNvbmRzKCkgPT0gMCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlRGFpbHkoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIDEwMDApXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KVxuXG59KTsiXX0=
