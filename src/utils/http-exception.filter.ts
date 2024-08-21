import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const error = JSON.parse(JSON.stringify(exception.getResponse()));

    // Verifica erro retornado
    switch (error.code) {
      // Verifica se o erro retornado é de dados duplicados na tabela
      case '23505':
        // Define mensagem de erro
        error.message += 'Já existe um registro igual a este cadastrado.'
        break;
      // Verifica se o erro retornado é de dados nulos
      case '23502':
        // Define mensagem de erro
        error.message += 'Alguns dados nulos são obrigatórios.'
        break;
      // Verifica se o erro retornado é de dados relacionais não encontrado
      case '23503':
        // Define mensagem de erro
        error.message += 'O id de relação informado não existe.'
        break;
      case undefined:
        if (!Array.isArray(error.message)) {
          error.message += (typeof error.erro != 'string' ? JSON.stringify(error.erro) : error.erro) || '';
        }
        break;
    }
    
    response
      .status(status)
      .json({
        data: null,
        message: 'Não foi possível realizar ação.',
        error: (Array.isArray(error.message) ? error.message : [error.message || exception.message]) 
      });
  }
}