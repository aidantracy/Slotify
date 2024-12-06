/**
 * Creates an event object that will be used within a calendar
 */

class Event {

    //includes date and title of event, list of people can later become list of "user" objects
    constructor(date, startTime, endTime, title, subject, owner, attendees) {

        // const now = new Date(); //current time
        // this.date = new Date(date)
        this.date = date

        this.startTime = startTime
        // const [start_hour, start_min] = startTime.split(':').map(Number);
        // this.startTime = new Date(date);
        // this.startTime.setHours(start_hour,start_min);

        this.endTime = endTime
        // const [end_hour, end_min] = endTime.split(':').map(Number);
        // this.endTime = new Date(date);
        // this.endTime.setHours(end_hour, end_min);
    
        // if (this.date <= now) {
        // throw new Error('The event date must be in the future.');
        // }
       
        this.title = title
        this.subject = subject
        this.owner = owner

        attendees == null ? this.attendees = new Array() : this.attendees = attendees
        
    }

    //adds a user object to the event's attendee list
    addPerson(user) {
        this.attendees = attendees.push(user)
    }

    //removes a user object from the event's attendee list`
    removePerson(firstName, lastName) {
        this.attendees = someArray.filter(user => user.firstName != user && user.lastName != lastName);
    }

    //reschedules the event
    changeDate(date) {
        this.date = date
    }

    //rename title of the event
    changeTitle(title) {
        this.title = title; 
    }

}

export default Event;