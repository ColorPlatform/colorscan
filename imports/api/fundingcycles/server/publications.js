import { Meteor } from 'meteor/meteor';
import { FundingCycless } from '../fundingcycles.js';
import { check } from 'meteor/check'

Meteor.publish('fundingcycles.list', function () {
    return FundingCycless.find({}, {sort:{cycleId:-1}});
});

Meteor.publish('fundingcycles.one', function (id){
    check(id, Number);
    return FundingCycless.find({cycleId:id});
})