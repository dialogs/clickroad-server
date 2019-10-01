organization := "im.dlg.clickroad"

name := "api"

version := "0.0.2-SNAPSHOT"

scalaVersion := "2.12.8"

crossScalaVersions := List("2.11.12", "2.12.8", "2.13.0")

libraryDependencies ++= Seq(
  "com.thesamet.scalapb" %% "scalapb-runtime" % scalapb.compiler.Version.scalapbVersion % "protobuf",
  "com.thesamet.scalapb" %% "scalapb-runtime-grpc" % scalapb.compiler.Version.scalapbVersion,
  "io.grpc" % "grpc-netty" % scalapb.compiler.Version.grpcJavaVersion
)

PB.protoSources in Compile += baseDirectory.value / ".." / "proto"

excludeFilter in PB.generate := "clickroad-private.proto"

PB.targets in Compile := Seq(
  scalapb.gen(singleLineToProtoString = true) → (sourceManaged in Compile).value
)

licenses += ("Apache-2.0", url("https://www.apache.org/licenses/LICENSE-2.0.html"))

publishMavenStyle := true

enablePlugins(Publishing)
