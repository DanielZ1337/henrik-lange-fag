FROM oven/bun:1
WORKDIR /usr/src/app

# copy server files into the image
COPY /server /usr/src/app

# copy dist files from client into the image
COPY /client/dist /usr/src/client/dist

# install all dependencies
RUN bun install --frozen-lockfile --production

# run the app
USER bun
EXPOSE 3000/tcp
WORKDIR /usr/src/app
RUN bun run db:migrate
RUN bun run db:push
ENTRYPOINT [ "bun", "run", "start" ]