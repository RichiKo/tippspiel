import { AuthGuard } from '@app/guards/auth.guard';
import { CreateUserDto } from '@app/user/dto/create-user.dto';
import { LoginUserDto } from '@app/user/dto/login-user.dto';
import { UpdateUserDto } from '@app/user/dto/update-user.dto';
import { User } from '@app/user/decoratos/user.decorator';
import { UserEntity } from '@app/user/user.entity';
import { UserResponseInterface } from '@app/user/types/user-response';
import { UserService } from '@app/user/user.service';
import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('users')
  @UsePipes(new ValidationPipe())
  async createUser(
    @Body('user') createUserDto: CreateUserDto,
  ): Promise<UserResponseInterface> {
    const savedUser = await this.userService.createUser(createUserDto);
    return this.userService.buildUserResponse(savedUser);
  }

  @Get('user')
  @UseGuards(AuthGuard)
  getCurrentUser(@User() user: UserEntity): UserResponseInterface {
    return this.userService.buildUserResponse(user);
  }

  @Post('users/login')
  @UsePipes(new ValidationPipe())
  async login(
    @Body('user') loginUserDto: LoginUserDto,
  ): Promise<UserResponseInterface> {
    const loggedUser = await this.userService.login(loginUserDto);
    return this.userService.buildUserResponse(loggedUser);
  }

  @Put('user')
  @UsePipes(new ValidationPipe())
  @UseGuards(AuthGuard)
  async updateCurrentUser(
    @Body('user') userToUpdate: UpdateUserDto,
    @User('id') currentUserId: number,
  ): Promise<UserResponseInterface> {
    const updatedUser = await this.userService.updatetUser(
      currentUserId,
      userToUpdate,
    );
    return this.userService.buildUserResponse(updatedUser);
  }
}
