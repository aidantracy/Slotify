/**
 * User class defines a user and has built in functionality for validating the names as well as the users email. 
 */
class User {    
    constructor(firstName, lastName, email) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }

    // first name cannot exceed 30 chars
    validateFirst() {
        return this.firstName.length <= 30;
    }

    // last name cannot exceed 30 chars
    validateLast() {
        return this.lastName.length <= 30;
    }

    // Validate email, rules:
    // - must be 320 chars or less
    // - cannot start or end with '.'
    // - only one '@' allowed
    validateEmail() {
        // Validate length
        if (this.email.length > 320) return false;

        // Validate '@' count
        const atCount = (this.email.match(/@/g) || []).length;
        if (atCount !== 1) return false;

        // Split email by '@'
        const [name, domain] = this.email.split("@");

        // Validate domain and name parts exist and size constraints
        if (!name || !domain || domain.length > 63) return false;

        // '.' cannot be first or last character
        if (this.email.startsWith(".") || this.email.endsWith(".")) return false;

        // Check domain for at least one '.' 
        if (!domain.includes(".")) return false;

        return true;
    }
}

export default User; 