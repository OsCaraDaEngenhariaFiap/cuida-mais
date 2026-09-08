FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /build/target/certa-0.0.1-SNAPSHOT.jar /app/app.jar

ENV TNS_ADMIN=/app/wallet
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
