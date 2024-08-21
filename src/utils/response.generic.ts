import { ApiProperty } from "@nestjs/swagger";

export class ResponseGeneric<T> {
    @ApiProperty()
    data: T;
    @ApiProperty()
    message: string;
    @ApiProperty()
    error: string;
    constructor(data: T = null, message: string = "Ação realizada com sucesso.", error: string = null) {
        return {
            message,
            error,
            data
        }
    }
}