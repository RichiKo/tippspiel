import { compare } from 'bcrypt';
import { CreateUserDto } from '@app/user/dto/create-user.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginUserDto } from '@app/user/dto/login-user.dto';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { UpdateUserDto } from '@app/user/dto/update-user.dto';
import { UserEntity } from '@app/user/user.entity';
import { UserResponseInterface } from '@app/user/types/user-response';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      throw new HttpException(
        'Email or username are taken',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // alternative
    // const newUser = new UserEntity();
    // Object.assign(newUser, createUserDto);
    const newUser = this.userRepository.create(createUserDto);

    return await this.userRepository.save(newUser);
  }

  async updatetUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const user = await this.findById(userId);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (updateUserDto.username) user.username = updateUserDto.username;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.image) user.image = updateUserDto.image;
    if (updateUserDto.role) user.role = updateUserDto.role;

    if (updateUserDto.password) {
      user.password = updateUserDto.password;
    }

    return await this.userRepository.save(user);
  }

  async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOne({
      where: { email: loginUserDto.email },
      select: ['id', 'email', 'image', 'password', 'role', 'username'],
    });

    if (!existingUser) {
      throw new HttpException(
        'Credentials are not valid',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const isPasswordCorrect = await compare(
      loginUserDto.password,
      existingUser.password,
    );

    if (!isPasswordCorrect) {
      throw new HttpException(
        'Credentials are not valid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userResponse: Partial<UserEntity> = { ...existingUser };
    delete userResponse.password;

    return userResponse as UserEntity;
  }

  findById(id: number): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  generateJwt(user: UserEntity): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
    ) as string;
  }

  buildUserResponse(user: UserEntity): UserResponseInterface {
    return {
      user: {
        ...user,
        token: this.generateJwt(user),
      },
    };
  }
}
