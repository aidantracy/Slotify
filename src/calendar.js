//const event = require('./event.js');

import Event from "./event.js";

class Calendar {

    constructor(user, numDays) {
        this.user = user;
        this.timeSlots = [];
        this.events = [];
        this.numDays = numDays;
    }

    //add a time slot to the calendar
    addSlot(date, startTime, endTime) {
        if (!this.checkConflict(date, startTime, endTime)) {
            const input = {date: date, start: startTime, end: endTime }; 
            this.timeSlots.push(input);
            console.log(`Added time slot: ${startTime}`);
        } else {
            console.log("Date to be added to calendar is not available");
        }
    }

    addEventToSlot(date, startTime, endTime, title, subject, attendees) {
        
        if(!this.checkConflict(date, startTime, endTime)) {

        this.addSlot(date, startTime, endTime);
        var newEvent = new Event(date, startTime, endTime, title, subject, this.user, attendees);
        this.events.push(newEvent);
        console.log(`Added event: ${title}`);
        }
        else {
            console.log("Event could not be created")
        }
    }

    //remove a time slot from the calendar
    removeSlot(date, startTime, endTime) {
        const index = this.timeSlots.findIndex(
            slot => slot.date === date && slot.start === startTime && slot.end === endTime
        );
        
        if (index < 0) {
            console.log("Requested time slot to remove is not present");
        } else {
            this.timeSlots.splice(index, 1);  // Properly remove the slot
            console.log(`Deleted time slot: ${date} ${startTime}`);
        }
    }

    removeEvent(date, startTime, endTime, title) {
        
        const index = this.events.findIndex(
            event => event.title === title && event.startTime === startTime && event.endTime === endTime
        );

        if (index < 0) {
            console.log("Requested time slot to remove is not present");
        } else {
            this.events.splice(index,1);
            console.log(`Deleted Event: ${title}`);
            this.removeSlot(date, startTime, endTime);
        }

    }


    //determine if there an overlapping time slot already in the calendar
    checkConflict(date, startTime, endTime) {
        for (let index = 0; index < this.timeSlots.length; index++) {
            var current = this.timeSlots[index]
            if (current.start >= startTime && current.start <= endTime && current.date === date) {
                return true
            } else if (current.start <= startTime && current.end >= startTime && current.date === date) {
                return true
            } else { // No conflict
                return false
            }
        }
    }

    toString() {
        let ret = `Calendar for ${this.user}:\n`;
        if (this.timeSlots.length === 0) {
            ret += "No time slots booked.";
        } else {
            this.timeSlots.forEach((slot, index) => {
                ret += `${index + 1}. ${slot.date} ${slot.start}\n`;
            });
        }
        return ret;
    }

    toStringEvent() {
        let ret = `Calendar for ${this.user}:\n`;
        if (this.events.length === 0) {
            ret += "No events scheduled.";
        } else {
            this.events.forEach((event, index) => {
                ret += `${index + 1}. ${event.date} ${event.startTime} ${event.title}\n`;
            });
        }
        return ret;
    }
    

    static main() {
        const testCalendar = new Calendar("user1", [], 30);

        // Adding time slots test 1
        // testCalendar.addSlot("10/20/2024, 10:00 AM");
        // testCalendar.addSlot("10/13/2024, 11:00 AM");
        // testCalendar.addSlot("10/4/2024, 03:00 PM");
        // testCalendar.addSlot("11/11/2024", "10:00 AM", "10:30 AM");
        // testCalendar.addSlot("11/11/2024", "11:00 AM", "11:30 AM");
        testCalendar.addEventToSlot("11/11/2024", "10:00 AM", "10:30 AM", "Meeting 1", "just a meeting", "Me, myself, I");
        console.log(testCalendar.toString());
        console.log(testCalendar.toStringEvent());

        // Removing test 1
        // console.log("\nRemoving a slot that exists:");
        // testCalendar.removeSlot("11/11/2024", "11:00 AM","11:30 AM");  // Should succeed
        testCalendar.removeEvent("11/11/2024", "10:00 AM", "10:30 AM", "Meeting 1");

        // // Attempt to remove a time slot that doesn't exist
        // console.log("\nAttempting to remove a slot that does not exist:");
        testCalendar.removeSlot("10/25/2024, 02:00 PM");  // Should fail
        console.log("\nUpdated calendar:");
        console.log(testCalendar.toString());
    }

}

Calendar.main();

export default Calendar;