import { IsNumber, IsOptional } from "class-validator";

export class GetDashsDto {

    @IsOptional()
    @IsNumber({}, { message: "O 'valorTarefasMes' deve ser um número. "})
    valorTarefasMes?: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'HorasMes' deve ser um número. "})
    horasMes?: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'valorMediaTarefas' deve ser um número. "})
    valorMediaTarefas?: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'usuariosCadastrados' deve ser um número. "})
    usuariosCadastrados?: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'colaboradores' deve ser um número. "})
    colaboradores?: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'TarefasMes' deve ser um número. "})
    tarefasMes?: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'TarefasCanceladasMes' deve ser um número. "})
    tarefasCanceladasMes?: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'TarefasFinalizadasMes' deve ser um número. "})
    tarefasFinalizadasMes?: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'TarefasPendentesMes' deve ser um número. "})
    tarefasPendentesMes?: number;

    @IsOptional()
    @IsNumber({}, { message: "O 'TarefasAbertasMes' deve ser um número. "})
    tarefasAbertasMes?: number;

}