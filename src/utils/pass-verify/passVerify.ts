export class PassVerify {
    async passVerify(pass: string) {
        if (!pass.match(/^(?=.*[0-9])(?=.*[-.,;:=+_?!@#$%^&*\/\\])(?=.*[A-Z])(?=.*[a-z])[a-zA-Z0-9-.,;:=+_?!@#$%^&*\/\\]{8,}$/g)) {
            return false;
        }
        return true;
    }
}